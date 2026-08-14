// @vitest-environment jsdom
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

const createAll = vi.fn()

vi.mock('govuk-frontend', () => ({
  createAll,
  Button: 'Button',
  Checkboxes: 'Checkboxes',
  ErrorSummary: 'ErrorSummary',
  Header: 'Header',
  Radios: 'Radios',
  SkipLink: 'SkipLink'
}))

vi.mock('./cookie-banner.js', () => ({
  initCookieBanner: vi.fn()
}))

vi.mock('./cookies-page.js', () => ({
  initCookiesPage: vi.fn()
}))

vi.mock('./load-analytics.js', () => ({
  loadAnalytics: vi.fn()
}))

vi.mock('./cookie-functions.js', () => ({
  getConsentCookie: vi.fn(),
  isValidConsentCookie: vi.fn(),
  removeUACookies: vi.fn()
}))

beforeEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
  vi.clearAllMocks()
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('application', () => {
  test('Should register all GOV.UK Frontend components', async () => {
    await import('./application.js')

    expect(createAll).toHaveBeenCalledTimes(6)
  })

  test('Should not initialise the cookie banner when it is absent from the page', async () => {
    const { initCookieBanner } = await import('./cookie-banner.js')

    await import('./application.js')

    expect(initCookieBanner).not.toHaveBeenCalled()
  })

  test('Should initialise the cookie banner when present on the page', async () => {
    document.body.innerHTML = '<div data-module="govuk-cookie-banner"></div>'
    const { initCookieBanner } = await import('./cookie-banner.js')

    await import('./application.js')

    expect(initCookieBanner).toHaveBeenCalledWith(
      document.querySelector('[data-module="govuk-cookie-banner"]')
    )
  })

  test('Should not initialise the cookies page when it is absent from the page', async () => {
    const { initCookiesPage } = await import('./cookies-page.js')

    await import('./application.js')

    expect(initCookiesPage).not.toHaveBeenCalled()
  })

  test('Should initialise the cookies page when present on the page', async () => {
    document.body.innerHTML = '<div data-module="app-cookies-page"></div>'
    const { initCookiesPage } = await import('./cookies-page.js')

    await import('./application.js')

    expect(initCookiesPage).toHaveBeenCalledWith(
      document.querySelector('[data-module="app-cookies-page"]')
    )
  })

  test('Should not load analytics when there is no stored consent', async () => {
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { loadAnalytics } = await import('./load-analytics.js')

    await import('./application.js')

    expect(loadAnalytics).not.toHaveBeenCalled()
  })

  test('Should not load analytics when the consent cookie is invalid', async () => {
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue({ analytics: true })
    CookieFunctions.isValidConsentCookie.mockReturnValue(false)
    const { loadAnalytics } = await import('./load-analytics.js')

    await import('./application.js')

    expect(loadAnalytics).not.toHaveBeenCalled()
  })

  test('Should not load analytics when the user has not opted in', async () => {
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue({ analytics: false })
    CookieFunctions.isValidConsentCookie.mockReturnValue(true)
    const { loadAnalytics } = await import('./load-analytics.js')

    await import('./application.js')

    expect(loadAnalytics).not.toHaveBeenCalled()
  })

  test('Should load analytics and remove UA cookies when the user has consented', async () => {
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue({ analytics: true })
    CookieFunctions.isValidConsentCookie.mockReturnValue(true)
    const { loadAnalytics } = await import('./load-analytics.js')

    await import('./application.js')

    expect(loadAnalytics).toHaveBeenCalled()
    expect(CookieFunctions.removeUACookies).toHaveBeenCalled()
  })
})
