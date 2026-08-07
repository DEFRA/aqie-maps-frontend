import { loadAnalytics } from './load-analytics.mjs'

const CONSENT_COOKIE_NAME = 'airaqie_cookies_analytics'

const TRACKING_PREVIEW_ID = 'NX0F88HVBL'
const TRACKING_LIVE_ID = 'NX0F88HVBL'

const COOKIE_CATEGORIES = {
  analytics: ['_ga', `_ga_${TRACKING_PREVIEW_ID}`, `_ga_${TRACKING_LIVE_ID}`],
  // Essential cookies cannot be deselected but must be listed here
  essential: ['airaqie_cookies_analytics']
}

const DEFAULT_COOKIE_CONSENT = {
  analytics: false
}

export function manageCookie(name, value, options = {}) {
  if (arguments.length === 1) {
    return getCookie(name)
  }
  if (value === false || value === null) {
    return deleteCookie(name)
  }
  if (!options.days) {
    options.days = 30
  }
  return setCookie(name, value, options)
}

export function getConsentCookie() {
  const consentCookie = getCookie(CONSENT_COOKIE_NAME)
  if (!consentCookie) {
    return null
  }
  try {
    return JSON.parse(consentCookie)
  } catch {
    return null
  }
}

export function isValidConsentCookie(options) {
  // @ts-expect-error Property does not exist on window
  return options && options.version >= window.AQ_CONSENT_COOKIE_VERSION
}

export function setConsentCookie(options) {
  const cookieConsent =
    getConsentCookie() || JSON.parse(JSON.stringify(DEFAULT_COOKIE_CONSENT))

  for (const option in options) {
    cookieConsent[option] = options[option]
  }

  delete cookieConsent.essential

  // @ts-expect-error Property does not exist on window
  cookieConsent.version = window.AQ_CONSENT_COOKIE_VERSION

  setCookie(CONSENT_COOKIE_NAME, JSON.stringify(cookieConsent), { days: 365 })
  resetCookies()
}

export function resetCookies() {
  try {
    const options =
      getConsentCookie() || JSON.parse(JSON.stringify(DEFAULT_COOKIE_CONSENT))

    for (const cookieType in options) {
      if (cookieType === 'version' || cookieType === 'essential') {
        continue
      }

      if (cookieType === 'analytics' && options[cookieType]) {
        window[`ga-disable-UA-${TRACKING_PREVIEW_ID}`] = false
        window[`ga-disable-UA-${TRACKING_LIVE_ID}`] = false
        loadAnalytics()
        removeUACookies()
      } else {
        window[`ga-disable-UA-${TRACKING_PREVIEW_ID}`] = true
        window[`ga-disable-UA-${TRACKING_LIVE_ID}`] = true
      }

      if (!options[cookieType]) {
        COOKIE_CATEGORIES[cookieType].forEach((cookie) => {
          manageCookie(cookie, null)
        })
      }
    }
  } catch (error) {
    console.error('Failed to reset cookies', error) // eslint-disable-line no-console
  }
}

export function removeUACookies() {
  for (const UACookie of [
    '_gid',
    '_gat_UA-26179049-17',
    '_gat_UA-116229859-1'
  ]) {
    manageCookie(UACookie, null)
  }
}

function userAllowsCookieCategory(cookieCategory, cookiePreferences) {
  if (cookieCategory === 'essential') {
    return true
  }
  try {
    return !!cookiePreferences[cookieCategory]
  } catch {
    return false
  }
}

function userAllowsCookie(cookieName) {
  if (cookieName === CONSENT_COOKIE_NAME) {
    return true
  }
  let cookiePreferences = getConsentCookie()
  if (!isValidConsentCookie(cookiePreferences)) {
    cookiePreferences = DEFAULT_COOKIE_CONSENT
  }
  for (const category in COOKIE_CATEGORIES) {
    if (Object.hasOwn(COOKIE_CATEGORIES, category)) {
      if (COOKIE_CATEGORIES[category].indexOf(cookieName) !== -1) {
        return userAllowsCookieCategory(category, cookiePreferences)
      }
    }
  }
  return false
}

function getCookie(name) {
  const nameEQ = `${name}=`
  const cookies = document.cookie.split(';')
  for (let i = 0, len = cookies.length; i < len; i++) {
    let cookie = cookies[i]
    while (cookie.startsWith(' ')) {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

function setCookie(name, value, options) {
  try {
    if (userAllowsCookie(name)) {
      options = options || {}
      let cookieString = `${name}=${value}; path=/`
      if (options.days) {
        const date = new Date()
        date.setTime(date.getTime() + options.days * 24 * 60 * 60 * 1000)
        cookieString += `; expires=${date.toUTCString()}`
      }
      if (document.location.protocol === 'https:') {
        cookieString += '; Secure'
      }
      document.cookie = cookieString
    }
  } catch (error) {
    console.error(`Failed to set cookie: ${name}`, error) // eslint-disable-line no-console
  }
}

function deleteCookie(name) {
  try {
    if (manageCookie(name)) {
      const domain = window.location.hostname
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=${domain};path=/`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.${domain};path=/`
    }
  } catch (error) {
    console.error(`Failed to delete cookie: ${name}`, error) // eslint-disable-line no-console
  }
}
