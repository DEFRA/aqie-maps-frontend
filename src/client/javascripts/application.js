import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'
import { CookieBanner } from './cookie-banner.mjs'
import { CookiesPage } from './cookies-page.mjs'
import { loadAnalytics } from './load-analytics.mjs'
import {
  getConsentCookie,
  isValidConsentCookie,
  removeUACookies
} from './cookie-functions.mjs'

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
  new CookieBanner($cookieBanner) // eslint-disable-line no-new
}

const userConsent = getConsentCookie() || { analytics: false }
if (userConsent && isValidConsentCookie(userConsent) && userConsent.analytics) {
  loadAnalytics()
  removeUACookies()
}

const $cookiesPage = document.querySelector(COOKIES_PAGE_SELECTOR)
if ($cookiesPage) {
  new CookiesPage($cookiesPage) // eslint-disable-line no-new
}
