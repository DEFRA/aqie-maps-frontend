/* global HTMLElement, HTMLFormElement, HTMLButtonElement, HTMLInputElement */
import { getConsentCookie, setConsentCookie } from './cookie-functions.js'

/**
 * Wires up the cookie preferences form: pre-fills the current consent,
 * reveals the form/button and saves preferences on submit.
 * @param {Element} $module
 */
function initCookiesPage($module) {
  if (
    !($module instanceof HTMLElement) ||
    !document.body.classList.contains('govuk-frontend-supported')
  ) {
    return
  }

  const $cookieForm = $module.querySelector('.js-cookies-page-form')
  if (!($cookieForm instanceof HTMLFormElement)) {
    return
  }

  const $cookieFormFieldsets = $cookieForm.querySelectorAll(
    '.js-cookies-page-form-fieldset'
  )
  const $cookieFormButton = $cookieForm.querySelector('.js-cookies-form-button')

  if (
    !$cookieFormFieldsets.length ||
    !($cookieFormButton instanceof HTMLButtonElement)
  ) {
    return
  }

  const $successNotification = $module.querySelector('.js-cookies-page-success')

  const cookieConsent = getConsentCookie()

  $cookieFormFieldsets.forEach(($fieldset) => {
    showUserPreference($fieldset, cookieConsent)
    $fieldset.removeAttribute('hidden')
  })

  $cookieFormButton.removeAttribute('hidden')

  $cookieForm.addEventListener('submit', (event) => {
    savePreferences(event, $cookieFormFieldsets, $successNotification)
  })
}

function savePreferences(event, $cookieFormFieldsets, $successNotification) {
  event.preventDefault()

  const preferences = {}

  $cookieFormFieldsets.forEach(($fieldset) => {
    const cookieType = getCookieType($fieldset)
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
  showSuccessNotification($successNotification)
}

function showUserPreference($fieldset, preferences) {
  const cookieType = getCookieType($fieldset)
  if (!cookieType) {
    return
  }
  const preference = preferences?.[cookieType] ?? false
  const radioValue = preference ? 'yes' : 'no'
  const $radio = $fieldset.querySelector(
    `input[name="cookies[${cookieType}]"][value=${radioValue}]`
  )
  if ($radio) {
    $radio.checked = true
  }
}

function showSuccessNotification($successNotification) {
  if (!($successNotification instanceof HTMLElement)) {
    return
  }
  $successNotification.removeAttribute('hidden')
  if (!$successNotification.getAttribute('tabindex')) {
    $successNotification.setAttribute('tabindex', '-1')
  }
  $successNotification.focus()
  window.scrollTo(0, 0)
}

function getCookieType($fieldset) {
  return $fieldset.dataset.cookieType || null
}

export { initCookiesPage }
