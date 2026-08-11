import * as CookieFunctions from './cookie-functions.mjs'

const cookieBannerAcceptSelector = '.js-cookie-banner-accept'
const cookieBannerRejectSelector = '.js-cookie-banner-reject'
const cookieBannerHideButtonSelector = '.js-cookie-banner-hide'
const cookieMessageSelector = '.js-cookie-banner-message'
const cookieConfirmationAcceptSelector = '.js-cookie-banner-confirmation-accept'
const cookieConfirmationRejectSelector = '.js-cookie-banner-confirmation-reject'

export class CookieBanner {
  constructor($module) {
    if (!this.isValidModule($module)) {
      return
    }
    this.$cookieBanner = $module
    if (!this.initializeElements() || !this.setupEventListeners()) {
      return
    }
    this.showBannerIfNoConsent()
  }

  isValidModule($module) {
    return (
      $module instanceof HTMLElement &&
      document.body.classList.contains('govuk-frontend-supported') &&
      !this.onCookiesPage()
    )
  }

  initializeElements() {
    this.$acceptButton = this.$cookieBanner.querySelector(cookieBannerAcceptSelector)
    this.$rejectButton = this.$cookieBanner.querySelector(cookieBannerRejectSelector)
    this.$cookieMessage = this.$cookieBanner.querySelector(cookieMessageSelector)
    this.$cookieConfirmationAccept = this.$cookieBanner.querySelector(cookieConfirmationAcceptSelector)
    this.$cookieConfirmationReject = this.$cookieBanner.querySelector(cookieConfirmationRejectSelector)
    this.$cookieBannerHideButtons = this.$cookieBanner.querySelectorAll(cookieBannerHideButtonSelector)

    return (
      this.$acceptButton instanceof HTMLButtonElement &&
      this.$rejectButton instanceof HTMLButtonElement &&
      this.$cookieMessage instanceof HTMLElement &&
      this.$cookieConfirmationAccept instanceof HTMLElement &&
      this.$cookieConfirmationReject instanceof HTMLElement &&
      this.$cookieBannerHideButtons.length > 0
    )
  }

  setupEventListeners() {
    if (!this.$acceptButton || !this.$rejectButton || !this.$cookieBannerHideButtons) {
      return false
    }
    this.$acceptButton.addEventListener('click', () => this.acceptCookies())
    this.$rejectButton.addEventListener('click', () => this.rejectCookies())
    this.$cookieBannerHideButtons.forEach(($btn) => {
      $btn.addEventListener('click', () => this.hideBanner())
    })
    return true
  }

  showBannerIfNoConsent() {
    if (!CookieFunctions.getConsentCookie()) {
      CookieFunctions.resetCookies()
      this.$cookieBanner.removeAttribute('hidden')
      return true
    }
    return false
  }

  hideBanner() {
    if (this.$cookieBanner) {
      this.$cookieBanner.setAttribute('hidden', 'true')
    }
  }

  acceptCookies() {
    CookieFunctions.setConsentCookie({ analytics: true })
    this.$cookieMessage.setAttribute('hidden', 'true')
    this.revealConfirmationMessage(this.$cookieConfirmationAccept)
  }

  rejectCookies() {
    CookieFunctions.setConsentCookie({ analytics: false })
    this.$cookieMessage.setAttribute('hidden', 'true')
    this.revealConfirmationMessage(this.$cookieConfirmationReject)
  }

  revealConfirmationMessage(confirmationMessage) {
    confirmationMessage.removeAttribute('hidden')
    if (!confirmationMessage.getAttribute('tabindex')) {
      confirmationMessage.setAttribute('tabindex', '-1')
      confirmationMessage.addEventListener('blur', () => {
        confirmationMessage.removeAttribute('tabindex')
      })
    }
    confirmationMessage.focus()
  }

  onCookiesPage() {
    return window.location.pathname === '/cookies/'
  }
}
