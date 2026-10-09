/* global MutationObserver */

import { stationMarkerId } from './map-station-data.js'

/**
 * Creates the marker accessibility controller for keyboard navigation of map markers.
 * @param {object} params
 * @param {() => Array<object>} params.getSortedStations
 * @param {(station: object) => void} params.onActivateStation - called on Enter/Space on a marker
 * @param {() => void} params.closeStationPanel - called on Escape within the station panel
 * @returns {{ initMarkerObserver: Function, initMapMouseInteraction: Function, initStationPanelKeyboard: Function }}
 */
function createMarkerAccessibility({
  getSortedStations,
  onActivateStation,
  closeStationPanel
}) {
  const stationPanelElement = document.getElementById('station-panel')

  /**
   * Patches a marker SVG element with the attributes needed for keyboard access.
   * The Defra InteractiveMap component renders each marker as an
   * <svg id="map-marker-{id}" role="img"> element with no tabindex, so keyboard
   * users cannot reach or activate markers without this patch.
   * Uses a data attribute to skip re-initialisation when the same DOM element
   * has its SVG content updated by a later addMarker call.
   * @param {string} markerId - the marker id passed to map.addMarker (e.g. "ms-UKA001")
   * @param {{ name?: string }} station
   */
  function makeMarkerKeyboardAccessible(markerId, station) {
    const el = document.getElementById(`map-marker-${markerId}`)
    if (!el || el.dataset.keyboardInit) {
      return
    }
    el.setAttribute('tabindex', '0')
    el.setAttribute('role', 'button')
    el.setAttribute('aria-label', station.name ?? 'Monitoring station')
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onActivateStation(station)
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        const filterPanel = document.getElementById('filter-panel')
        if (filterPanel && !filterPanel.hidden) {
          document.getElementById('filter-panel-close')?.focus()
        } else {
          document.getElementById('filter-button')?.focus()
        }
      }
    })
    el.dataset.keyboardInit = 'true'
  }

  /**
   * Watches the marker container for new elements and patches each one via
   * makeMarkerKeyboardAccessible as soon as it appears.
   * This is necessary because the Defra InteractiveMap component creates marker
   * DOM elements asynchronously — calling document.getElementById() immediately
   * after map.addMarker() would find nothing.
   * In the test environment, .im-c-viewport__markers does not exist, so we fall
   * back to observing #map directly.
   */
  function initMarkerObserver() {
    const container =
      document.querySelector('.im-c-viewport__markers') ??
      document.getElementById('map')
    if (!container) {
      return
    }

    const markerObserver = new MutationObserver((mutations) => {
      const addedMarkers = mutations.flatMap((mutation) =>
        Array.from(mutation.addedNodes)
      )
      addedMarkers.forEach((markerEl) => {
        if (markerEl.nodeType !== 1) {
          return // Node.ELEMENT_NODE
        }
        const markerId = markerEl.id?.replace('map-marker-', '')
        if (!markerId || markerEl.id === markerId) {
          return
        }
        const station = getSortedStations().find(
          (s) => stationMarkerId(s) === markerId
        )
        if (station) {
          makeMarkerKeyboardAccessible(markerId, station)
        }
      })
    })

    markerObserver.observe(container, { childList: true })
  }

  /**
   * Restores mouse-panning mode when the user initiates a mouse interaction on
   * the map after keyboard-navigating to a marker.
   * The Defra InteractiveMap component switches to keyboard mode whenever a
   * focusable element within it has focus, disabling mouse pan. A single
   * mousedown listener on the map container blurs any focused marker, which
   * returns the component to its normal mouse-panning state.
   */
  function initMapMouseInteraction() {
    document.getElementById('map')?.addEventListener('mousedown', () => {
      if (document.activeElement?.dataset.keyboardInit) {
        document.activeElement.blur()
      }
    })
  }

  /**
   * Wires up keyboard interaction for the station information panel.
   * Closes the panel when Escape is pressed.
   */
  function initStationPanelKeyboard() {
    stationPanelElement?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeStationPanel()
      }
    })
  }

  return {
    initMarkerObserver,
    initMapMouseInteraction,
    initStationPanelKeyboard
  }
}

export { createMarkerAccessibility }
