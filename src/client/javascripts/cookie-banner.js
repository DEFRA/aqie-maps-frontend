/* global HTMLElement, HTMLButtonElement */
import * as CookieFunctions from './cookie-functions.js'

const cookieBannerAcceptSelector = '.js-cookie-banner-accept'
const cookieBannerRejectSelector = '.js-cookie-banner-reject'
const cookieBannerHideButtonSelector = '.js-cookie-banner-hide'
const cookieMessageSelector = '.js-cookie-banner-message'
const cookieConfirmationAcceptSelector = '.js-cookie-banner-confirmation-accept'
const cookieConfirmationRejectSelector = '.js-cookie-banner-confirmation-reject'

/**
 * Wires up the GOV.UK cookie banner accept/reject/hide buttons and shows the
 * banner when no consent cookie has been set yet.
 * @param {Element} $module
 */
function initCookieBanner($module) {
  if (!isValidModule($module)) {
    return
  }

  const elements = findElements($module)
  if (!elements) {
    return
  }

  const {
    $acceptButton,
    $rejectButton,
    $cookieMessage,
    $cookieConfirmationAccept,
    $cookieConfirmationReject,
    $cookieBannerHideButtons
  } = elements

  $acceptButton.addEventListener('click', () => {
    CookieFunctions.setConsentCookie({ analytics: true })
    $cookieMessage.setAttribute('hidden', 'true')
    revealConfirmationMessage($cookieConfirmationAccept)
  })

  $rejectButton.addEventListener('click', () => {
    CookieFunctions.setConsentCookie({ analytics: false })
    $cookieMessage.setAttribute('hidden', 'true')
    revealConfirmationMessage($cookieConfirmationReject)
  })

  $cookieBannerHideButtons.forEach(($btn) => {
    $btn.addEventListener('click', () => {
      $module.setAttribute('hidden', 'true')
    })
  })

  showBannerIfNoConsent($module)
}

function isValidModule($module) {
  return (
    $module instanceof HTMLElement &&
    document.body.classList.contains('govuk-frontend-supported') &&
    !onCookiesPage()
  )
}

function findElements($module) {
  const $acceptButton = $module.querySelector(cookieBannerAcceptSelector)
  const $rejectButton = $module.querySelector(cookieBannerRejectSelector)
  const $cookieMessage = $module.querySelector(cookieMessageSelector)
  const $cookieConfirmationAccept = $module.querySelector(
    cookieConfirmationAcceptSelector
  )
  const $cookieConfirmationReject = $module.querySelector(
    cookieConfirmationRejectSelector
  )
  const $cookieBannerHideButtons = $module.querySelectorAll(
    cookieBannerHideButtonSelector
  )

  const isValid =
    $acceptButton instanceof HTMLButtonElement &&
    $rejectButton instanceof HTMLButtonElement &&
    $cookieMessage instanceof HTMLElement &&
    $cookieConfirmationAccept instanceof HTMLElement &&
    $cookieConfirmationReject instanceof HTMLElement &&
    $cookieBannerHideButtons.length > 0

  if (!isValid) {
    return null
  }

  return {
    $acceptButton,
    $rejectButton,
    $cookieMessage,
    $cookieConfirmationAccept,
    $cookieConfirmationReject,
    $cookieBannerHideButtons
  }
}

function showBannerIfNoConsent($module) {
  if (!CookieFunctions.getConsentCookie()) {
    CookieFunctions.resetCookies()
    $module.removeAttribute('hidden')
  }
}

function revealConfirmationMessage($confirmationMessage) {
  $confirmationMessage.removeAttribute('hidden')
  if (!$confirmationMessage.getAttribute('tabindex')) {
    $confirmationMessage.setAttribute('tabindex', '-1')
    $confirmationMessage.addEventListener('blur', () => {
      $confirmationMessage.removeAttribute('tabindex')
    })
  }
  $confirmationMessage.focus()
}

function onCookiesPage() {
  return window.location.pathname === '/cookies/'
}

export { initCookieBanner }
