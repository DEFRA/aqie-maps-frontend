const MAP_KEY_OVERLAY_ID = 'map-key-overlay'
const keyButtonElement = document.getElementById('key-button')

/** Whether the user manually closed the key overlay (prevents auto-reopen on panel close). */
const keyOverlayState = { closedByUser: false }

/**
 * Shows the map key overlay.
 */
function showKeyOverlay() {
  const overlay = document.getElementById(MAP_KEY_OVERLAY_ID)
  if (overlay) {
    overlay.hidden = false
  }
  keyButtonElement?.setAttribute('aria-expanded', 'true')
}

/**
 * Hides the map key overlay.
 * @param {boolean} byUser - true when the user explicitly dismissed it
 */
function hideKeyOverlay(byUser) {
  const overlay = document.getElementById(MAP_KEY_OVERLAY_ID)
  if (overlay) {
    overlay.hidden = true
  }
  keyButtonElement?.setAttribute('aria-expanded', 'false')
  if (byUser) {
    keyOverlayState.closedByUser = true
  }
}

/**
 * Wires up the map key close button.
 */
function initKeyOverlay() {
  document.getElementById('map-key-close')?.addEventListener('click', () => {
    hideKeyOverlay(true)
  })
}

/**
 * Wires up the Key toggle button in the reopen stack.
 */
function initReopenStack() {
  keyButtonElement?.addEventListener('click', () => {
    const overlay = document.getElementById(MAP_KEY_OVERLAY_ID)
    if (overlay?.hidden) {
      keyOverlayState.closedByUser = false
      showKeyOverlay()
    } else {
      hideKeyOverlay(true)
    }
  })
}

export {
  keyOverlayState,
  showKeyOverlay,
  hideKeyOverlay,
  initKeyOverlay,
  initReopenStack
}
