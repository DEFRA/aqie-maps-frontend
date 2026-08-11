import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'
import { initCookieBanner } from './cookie-banner.js'
import { initCookiesPage } from './cookies-page.js'
import { loadAnalytics } from './load-analytics.js'
import {
  getConsentCookie,
  isValidConsentCookie,
  removeUACookies
} from './cookie-functions.js'

const COOKIE_BANNER_SELECTOR = '[data-module="govuk-cookie-banner"]'
const COOKIES_PAGE_SELECTOR = '[data-module="app-cookies-page"]'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(Radios)
createAll(SkipLink)

const $cookieBanner = document.querySelector(COOKIE_BANNER_SELECTOR)
if ($cookieBanner) {
  initCookieBanner($cookieBanner)
}

const userConsent = getConsentCookie() || { analytics: false }
if (userConsent && isValidConsentCookie(userConsent) && userConsent.analytics) {
  loadAnalytics()
  removeUACookies()
}

const $cookiesPage = document.querySelector(COOKIES_PAGE_SELECTOR)
if ($cookiesPage) {
  initCookiesPage($cookiesPage)
}
