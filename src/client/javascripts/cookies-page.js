import { getConsentCookie, setConsentCookie } from './cookie-functions.mjs'

export class CookiesPage {
  constructor($module) {
    this.isValid = false

    if (
      !($module instanceof HTMLElement) ||
      !document.body.classList.contains('govuk-frontend-supported')
    ) {
      return
    }

    this.$page = $module

    const $cookieForm = this.$page.querySelector('.js-cookies-page-form')
    if (!($cookieForm instanceof HTMLFormElement)) {
      return
    }

    this.$cookieForm = $cookieForm

    const $cookieFormFieldsets = this.$cookieForm.querySelectorAll(
      '.js-cookies-page-form-fieldset'
    )
    const $cookieFormButton = this.$cookieForm.querySelector(
      '.js-cookies-form-button'
    )

    if (
      !$cookieFormFieldsets.length ||
      !($cookieFormButton instanceof HTMLButtonElement)
    ) {
      return
    }

    this.$cookieFormFieldsets = $cookieFormFieldsets
    this.$cookieFormButton = $cookieFormButton

    const $successNotification = this.$page.querySelector('.js-cookies-page-success')
    if ($successNotification instanceof HTMLElement) {
      this.$successNotification = $successNotification
    }

    const cookieConsent = getConsentCookie()

    this.$cookieFormFieldsets.forEach(($fieldset) => {
      this.showUserPreference($fieldset, cookieConsent)
      $fieldset.removeAttribute('hidden')
    })

    this.$cookieFormButton.removeAttribute('hidden')

    this.$cookieForm.addEventListener('submit', (event) => this.savePreferences(event))

    this.isValid = true
  }

  savePreferences(event) {
    event.preventDefault()

    const preferences = {}

    this.$cookieFormFieldsets.forEach(($fieldset) => {
      const cookieType = this.getCookieType($fieldset)
      if (!cookieType) {
        return
      }
      const $selectedItem = $fieldset.querySelector(
        `input[name="cookies[${cookieType}]"]:checked`
      )
      if ($selectedItem instanceof HTMLInputElement) {
        preferences[cookieType] = $selectedItem.value === 'yes'
      }
    })

    setConsentCookie(preferences)
    this.showSuccessNotification()
  }

  showUserPreference($fieldset, preferences) {
    const cookieType = this.getCookieType($fieldset)
    if (!cookieType) {
      return null
    }
    const preference = preferences?.[cookieType] ?? false
    const radioValue = preference ? 'yes' : 'no'
    const $radio = $fieldset.querySelector(
      `input[name="cookies[${cookieType}]"][value=${radioValue}]`
    )
    if (!$radio) {
      return null
    }
    $radio.checked = true
    return $radio
  }

  showSuccessNotification() {
    if (!this.$successNotification) {
      return false
    }
    this.$successNotification.removeAttribute('hidden')
    if (!this.$successNotification.getAttribute('tabindex')) {
      this.$successNotification.setAttribute('tabindex', '-1')
    }
    this.$successNotification.focus()
    window.scrollTo(0, 0)
    return true
  }

  getCookieType($fieldset) {
    return $fieldset.getAttribute('data-cookie-type') || null
  }
}
