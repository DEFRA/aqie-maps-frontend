// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://example.com" }
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

vi.mock('./load-analytics.js', () => ({
  loadAnalytics: vi.fn()
}))

function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    }
  })
}

beforeEach(() => {
  clearAllCookies()
  window.AQ_CONSENT_COOKIE_VERSION = 1
  vi.resetModules()
})

afterEach(() => {
  clearAllCookies()
  vi.restoreAllMocks()
})

describe('#manageCookie', () => {
  test('Should return null when reading a cookie that does not exist', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    expect(manageCookie('unknown_cookie')).toBeNull()
  })

  test('Should set and read back an essential cookie without consent', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    manageCookie('airaqie_cookies_analytics', JSON.stringify({ version: 1 }))
    expect(manageCookie('airaqie_cookies_analytics')).toBe(
      JSON.stringify({ version: 1 })
    )
  })

  test('Should not persist a non-essential cookie without consent', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    manageCookie('_ga', 'GA1.2.3')
    expect(manageCookie('_ga')).toBeNull()
  })

  test('Should not persist a cookie that belongs to no known category', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    manageCookie('some_unrecognised_cookie', 'value')
    expect(manageCookie('some_unrecognised_cookie')).toBeNull()
  })

  test('Should persist a non-essential cookie once analytics consent is granted', async () => {
    const { manageCookie, setConsentCookie } =
      await import('./cookie-functions.js')
    setConsentCookie({ analytics: true })
    manageCookie('_ga', 'GA1.2.3')
    expect(manageCookie('_ga')).toBe('GA1.2.3')
  })

  test('Should delete a cookie when value is null', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    manageCookie('airaqie_cookies_analytics', 'some-value')
    manageCookie('airaqie_cookies_analytics', null)
    expect(manageCookie('airaqie_cookies_analytics')).toBeNull()
  })

  test('Should delete a cookie when value is false', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    manageCookie('airaqie_cookies_analytics', 'some-value')
    manageCookie('airaqie_cookies_analytics', false)
    expect(manageCookie('airaqie_cookies_analytics')).toBeNull()
  })

  test('Should trim leading spaces when parsing multiple cookies', async () => {
    const { manageCookie } = await import('./cookie-functions.js')
    manageCookie('airaqie_cookies_analytics', 'a')
    document.cookie = 'unrelated=b; path=/'
    expect(manageCookie('airaqie_cookies_analytics')).toBe('a')
  })
})

describe('#getConsentCookie', () => {
  test('Should return null when no consent cookie is set', async () => {
    const { getConsentCookie } = await import('./cookie-functions.js')
    expect(getConsentCookie()).toBeNull()
  })

  test('Should return the parsed consent cookie', async () => {
    const { getConsentCookie, setConsentCookie } =
      await import('./cookie-functions.js')
    setConsentCookie({ analytics: true })
    expect(getConsentCookie()).toEqual({ analytics: true, version: 1 })
  })

  test('Should return null when the consent cookie is not valid JSON', async () => {
    const { getConsentCookie } = await import('./cookie-functions.js')
    document.cookie = 'airaqie_cookies_analytics=not-json;path=/'
    expect(getConsentCookie()).toBeNull()
  })
})

describe('#isValidConsentCookie', () => {
  test('Should return false when no consent options are given', async () => {
    const { isValidConsentCookie } = await import('./cookie-functions.js')
    expect(isValidConsentCookie(null)).toBeFalsy()
  })

  test('Should return true when the version matches the current version', async () => {
    const { isValidConsentCookie } = await import('./cookie-functions.js')
    expect(isValidConsentCookie({ version: 1 })).toBe(true)
  })

  test('Should return false when the version is older than the current version', async () => {
    const { isValidConsentCookie } = await import('./cookie-functions.js')
    expect(isValidConsentCookie({ version: 0 })).toBe(false)
  })
})

describe('#setConsentCookie', () => {
  test('Should store the given preferences alongside the current version', async () => {
    const { setConsentCookie, getConsentCookie } =
      await import('./cookie-functions.js')
    setConsentCookie({ analytics: true })
    expect(getConsentCookie()).toEqual({ analytics: true, version: 1 })
  })

  test('Should never persist an essential property on the consent cookie', async () => {
    const { setConsentCookie, getConsentCookie } =
      await import('./cookie-functions.js')
    setConsentCookie({ analytics: true, essential: true })
    expect(getConsentCookie()).not.toHaveProperty('essential')
  })

  test('Should load analytics when analytics consent is granted', async () => {
    const { setConsentCookie } = await import('./cookie-functions.js')
    const { loadAnalytics } = await import('./load-analytics.js')
    setConsentCookie({ analytics: true })
    expect(loadAnalytics).toHaveBeenCalled()
  })

  test('Should not load analytics when analytics consent is refused', async () => {
    const { setConsentCookie } = await import('./cookie-functions.js')
    const { loadAnalytics } = await import('./load-analytics.js')
    setConsentCookie({ analytics: false })
    expect(loadAnalytics).not.toHaveBeenCalled()
  })
})

describe('#resetCookies', () => {
  test('Should remove analytics cookies when consent is refused', async () => {
    const { setConsentCookie, manageCookie } =
      await import('./cookie-functions.js')
    setConsentCookie({ analytics: true })
    manageCookie('_ga', 'GA1.2.3')
    setConsentCookie({ analytics: false })
    expect(manageCookie('_ga')).toBeNull()
  })

  test('Should log an error when a stored consent category is unrecognised', async () => {
    const { setConsentCookie } = await import('./cookie-functions.js')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    setConsentCookie({ analytics: true, unknownCategory: false })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to reset cookies',
      expect.any(Error)
    )
  })
})

describe('#removeUACookies', () => {
  test('Should delete legacy Universal Analytics cookies', async () => {
    const { removeUACookies, manageCookie } =
      await import('./cookie-functions.js')
    document.cookie = '_gid=abc;path=/'
    removeUACookies()
    expect(manageCookie('_gid')).toBeNull()
  })
})
