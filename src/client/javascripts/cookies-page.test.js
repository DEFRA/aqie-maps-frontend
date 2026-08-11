// @vitest-environment jsdom
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

vi.mock('./cookie-functions.js', () => ({
  getConsentCookie: vi.fn(),
  setConsentCookie: vi.fn()
}))

const pageMarkup = `
  <div class="app-cookies-page">
    <div class="js-cookies-page-success" hidden></div>
    <form class="js-cookies-page-form">
      <fieldset
        class="js-cookies-page-form-fieldset"
        data-cookie-type="analytics"
        hidden
      >
        <input type="radio" name="cookies[analytics]" value="yes" />
        <input type="radio" name="cookies[analytics]" value="no" />
      </fieldset>
      <button class="js-cookies-form-button" hidden>Save</button>
    </form>
  </div>
`

function renderPage() {
  document.body.innerHTML = pageMarkup
  return document.querySelector('.app-cookies-page')
}

beforeEach(() => {
  document.body.classList.add('govuk-frontend-supported')
  vi.resetModules()
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.classList.remove('govuk-frontend-supported')
  vi.restoreAllMocks()
})

describe('#initCookiesPage', () => {
  test('Should do nothing when the module element is not an HTMLElement', async () => {
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookiesPage } = await import('./cookies-page.js')

    initCookiesPage(null)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should do nothing when the page is not GOV.UK Frontend supported', async () => {
    document.body.classList.remove('govuk-frontend-supported')
    const $module = renderPage()
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookiesPage } = await import('./cookies-page.js')

    initCookiesPage($module)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should do nothing when the form is missing', async () => {
    document.body.innerHTML = '<div class="app-cookies-page"></div>'
    const $module = document.querySelector('.app-cookies-page')
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookiesPage } = await import('./cookies-page.js')

    initCookiesPage($module)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should do nothing when there are no fieldsets or the save button is missing', async () => {
    document.body.innerHTML =
      '<div class="app-cookies-page"><form class="js-cookies-page-form"></form></div>'
    const $module = document.querySelector('.app-cookies-page')
    const CookieFunctions = await import('./cookie-functions.js')
    const { initCookiesPage } = await import('./cookies-page.js')

    initCookiesPage($module)

    expect(CookieFunctions.getConsentCookie).not.toHaveBeenCalled()
  })

  test('Should reveal the form when there are no stored preferences', async () => {
    const $module = renderPage()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookiesPage } = await import('./cookies-page.js')

    initCookiesPage($module)

    expect(
      $module
        .querySelector('.js-cookies-page-form-fieldset')
        .hasAttribute('hidden')
    ).toBe(false)
    expect(
      $module.querySelector('.js-cookies-form-button').hasAttribute('hidden')
    ).toBe(false)
    expect($module.querySelector('input[value="no"]').checked).toBe(true)
  })

  test('Should pre-select the stored preference', async () => {
    const $module = renderPage()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue({ analytics: true })
    const { initCookiesPage } = await import('./cookies-page.js')

    initCookiesPage($module)

    expect($module.querySelector('input[value="yes"]').checked).toBe(true)
  })

  test('Should save the selected preferences and show the success notification', async () => {
    const $module = renderPage()
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookiesPage } = await import('./cookies-page.js')
    initCookiesPage($module)

    $module.querySelector('input[value="yes"]').checked = true
    $module
      .querySelector('.js-cookies-page-form')
      .dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))

    expect(CookieFunctions.setConsentCookie).toHaveBeenCalledWith({
      analytics: true
    })
    const $successNotification = $module.querySelector(
      '.js-cookies-page-success'
    )
    expect($successNotification.hasAttribute('hidden')).toBe(false)
    expect($successNotification.getAttribute('tabindex')).toBe('-1')
  })

  test('Should do nothing when saving preferences without a success notification element', async () => {
    document.body.innerHTML = `
      <div class="app-cookies-page">
        <form class="js-cookies-page-form">
          <fieldset
            class="js-cookies-page-form-fieldset"
            data-cookie-type="analytics"
            hidden
          >
            <input type="radio" name="cookies[analytics]" value="yes" />
            <input type="radio" name="cookies[analytics]" value="no" checked />
          </fieldset>
          <button class="js-cookies-form-button" hidden>Save</button>
        </form>
      </div>
    `
    const $module = document.querySelector('.app-cookies-page')
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue(null)
    const { initCookiesPage } = await import('./cookies-page.js')
    initCookiesPage($module)

    $module
      .querySelector('.js-cookies-page-form')
      .dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))

    expect(CookieFunctions.setConsentCookie).toHaveBeenCalledWith({
      analytics: false
    })
  })

  test('Should ignore fieldsets without a data-cookie-type attribute', async () => {
    document.body.innerHTML = `
      <div class="app-cookies-page">
        <div class="js-cookies-page-success" hidden></div>
        <form class="js-cookies-page-form">
          <fieldset class="js-cookies-page-form-fieldset">
            <input type="radio" name="cookies[unknown]" value="yes" />
            <input type="radio" name="cookies[unknown]" value="no" />
          </fieldset>
          <fieldset
            class="js-cookies-page-form-fieldset"
            data-cookie-type="analytics"
            hidden
          >
            <input type="radio" name="cookies[analytics]" value="yes" />
            <input type="radio" name="cookies[analytics]" value="no" />
          </fieldset>
          <button class="js-cookies-form-button" hidden>Save</button>
        </form>
      </div>
    `
    const $module = document.querySelector('.app-cookies-page')
    const CookieFunctions = await import('./cookie-functions.js')
    CookieFunctions.getConsentCookie.mockReturnValue({ analytics: true })
    const { initCookiesPage } = await import('./cookies-page.js')
    initCookiesPage($module)

    $module
      .querySelector('.js-cookies-page-form')
      .dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))

    expect(CookieFunctions.setConsentCookie).toHaveBeenCalledWith({
      analytics: true
    })
  })
})
