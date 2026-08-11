// @vitest-environment jsdom
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

vi.mock('./cookie-functions.js', () => ({
  getConsentCookie: vi.fn(),
  setConsentCookie: vi.fn(),
  resetCookies: vi.fn()
}))

const bannerMarkup = `
  <div class="cookie-banner">
    <button class="js-cookie-banner-accept">Accept</button>
    <button class="js-cookie-banner-reject">Reject</button>
    <div class="js-cookie-banner-message"></div>
    <div class="js-cookie-banner-confirmation-accept" hidden></div>
    <div class="js-cookie-banner-confirmation-reject" hidden></div>
    <button class="js-cookie-banner-hide"></button>
  </div>
`

function renderBanner() {
  document.body.innerHTML = bannerMarkup
  return document.querySelector('.cookie-banner')
}

beforeEach(() => {
  document.body.classList.add('govuk-frontend-supported')
  window.history.pushState({}, '', '/')
  vi.resetModules()
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.classList.remove('govuk-frontend-supported')
  vi.restoreAllMocks()
})

describe('#initCookieBanner', () => {
  test('Should not initialise when the module element is not an HTMLElement', async () => {
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookieBanner } = await import('./cookie-banner.js')

    initCookieBanner(null)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should not initialise when the page is not GOV.UK Frontend supported', async () => {
    document.body.classList.remove('govuk-frontend-supported')
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookieBanner } = await import('./cookie-banner.js')

    initCookieBanner($module)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should not initialise when on the cookies preferences page', async () => {
    window.history.pushState({}, '', '/cookies/')
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookieBanner } = await import('./cookie-banner.js')

    initCookieBanner($module)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should not set up listeners when required elements are missing', async () => {
    document.body.innerHTML =
      '<div class="cookie-banner"><button class="js-cookie-banner-accept"></button></div>'
    const $module = document.querySelector('.cookie-banner')
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookieBanner } = await import('./cookie-banner.js')

    initCookieBanner($module)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should show the banner and reset cookies when there is no consent cookie', async () => {
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookieBanner } = await import('./cookie-banner.js')

    initCookieBanner($module)

    expect(CookieFunctions.resetCookies).toHaveBeenCalled()
    expect($module.hasAttribute('hidden')).toBe(false)
  })

  test('Should leave the banner hidden when a consent cookie already exists', async () => {
    const $module = renderBanner()
    $module.setAttribute('hidden', 'true')
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue({ analytics: true })
    const { initCookieBanner } = await import('./cookie-banner.js')

    initCookieBanner($module)

    expect(CookieFunctions.resetCookies).not.toHaveBeenCalled()
    expect($module.hasAttribute('hidden')).toBe(true)
  })

  test('Should accept cookies and reveal the accept confirmation message', async () => {
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookieBanner } = await import('./cookie-banner.js')
    initCookieBanner($module)

    $module.querySelector('.js-cookie-banner-accept').click()

    expect(CookieFunctions.setConsentCookie).toHaveBeenCalledWith({
      analytics: true
    })
    const $confirmation = $module.querySelector(
      '.js-cookie-banner-confirmation-accept'
    )
    expect(
      $module.querySelector('.js-cookie-banner-message').hasAttribute('hidden')
    ).toBe(true)
    expect($confirmation.hasAttribute('hidden')).toBe(false)
    expect($confirmation.getAttribute('tabindex')).toBe('-1')
  })

  test('Should reject cookies and reveal the reject confirmation message', async () => {
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookieBanner } = await import('./cookie-banner.js')
    initCookieBanner($module)

    $module.querySelector('.js-cookie-banner-reject').click()

    expect(CookieFunctions.setConsentCookie).toHaveBeenCalledWith({
      analytics: false
    })
    const $confirmation = $module.querySelector(
      '.js-cookie-banner-confirmation-reject'
    )
    expect(
      $module.querySelector('.js-cookie-banner-message').hasAttribute('hidden')
    ).toBe(true)
    expect($confirmation.hasAttribute('hidden')).toBe(false)
  })

  test('Should remove the tabindex once the confirmation message loses focus', async () => {
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookieBanner } = await import('./cookie-banner.js')
    initCookieBanner($module)

    $module.querySelector('.js-cookie-banner-accept').click()
    const $confirmation = $module.querySelector(
      '.js-cookie-banner-confirmation-accept'
    )
    $confirmation.dispatchEvent(new Event('blur'))

    expect($confirmation.getAttribute('tabindex')).toBeNull()
  })

  test('Should hide the banner when a hide button is clicked', async () => {
    const $module = renderBanner()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookieBanner } = await import('./cookie-banner.js')
    initCookieBanner($module)

    $module.querySelector('.js-cookie-banner-hide').click()

    expect($module.getAttribute('hidden')).toBe('true')
  })
})
