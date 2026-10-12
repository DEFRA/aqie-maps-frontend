/* global defra, history */

import {
  stationMarkerId,
  stationMapCoords,
  hasValidCoords,
  stationDaqi,
  loadMonitoringStations,
  loadForecasts,
  loadAurnData
} from './map-station-data.js'
import { daqiMarkerOptions } from './map-daqi.js'
import {
  stationMatchesFilter,
  isActiveStation,
  initFilterPanel,
  filterState
} from './map-filter-panel.js'
import { initKeyOverlay, initReopenStack } from './map-key-overlay.js'
import { createMarkerAccessibility } from './map-marker-accessibility.js'
import { createStationPanelController } from './map-station-panel.js'

const defaultZoom = 5.4842222
const ukCentreLng = -1.4649
const ukCentreLat = 52.5619

const ARIA_PRESSED = 'aria-pressed'
const TAB_ACTIVE_CLASS = 'aq-filter-panel__tab--active'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Maximum squared distance (degrees²) for a map click to select a station (~11 km at mid zoom).
const CLICK_SELECT_MAX_SQUARED_DEG = 0.01

const map = new defra.InteractiveMap('map', {
  mapProvider: defra.maplibreProvider(),
  behaviour: 'hybrid',
  mapLabel: 'United Kingdom',
  zoom: defaultZoom,
  center: [ukCentreLng, ukCentreLat],
  containerHeight: '100%',
  mapStyle: {
    url: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: 'OpenFreeMap \u00a9 OpenMapTiles Data from OpenStreetMap',
    backgroundColor: '#f5f5f0'
  }
})

const sortedStationsByLat = await loadMonitoringStations()
const forecasts = await loadForecasts()
const aurnDataByStation = await loadAurnData()

/** The currently selected forecast day abbreviation (e.g. 'Mon'). Defaults to today. */
let selectedForecastDay = DAY_ABBR[new Date().getDay()]

/**
 * Returns the current DAQI lookup context (mode, observed data, forecasts, selected day).
 * @returns {{ mapMode: string, aurnDataByStation: Map<string, number>, forecasts: Array<object>, selectedForecastDay: string }}
 */
function getDaqiContext() {
  return {
    mapMode: filterState.mapMode,
    aurnDataByStation,
    forecasts,
    selectedForecastDay
  }
}

const { closeStationPanel, highlightStation, panelState } =
  createStationPanelController({
    map,
    getSortedStations: () => sortedStationsByLat,
    getDaqiContext
  })

const {
  initMarkerObserver,
  initMapMouseInteraction,
  initStationPanelKeyboard
} = createMarkerAccessibility({
  getSortedStations: () => sortedStationsByLat,
  onActivateStation: highlightStation,
  closeStationPanel
})

/**
 * (Re)plots all markers that pass the current filter, removing any that no longer match.
 * Sorted north-to-south, then lowest-DAQI first within each latitude so that the
 * highest-DAQI marker is added last and renders on top.
 */
function plotAllMarkers() {
  const daqiContext = getDaqiContext()
  const sortByLatThenDaqi = [...sortedStationsByLat].sort((a, b) => {
    const latA = Number.parseFloat(a.location?.coordinates?.[0]) || 0
    const latB = Number.parseFloat(b.location?.coordinates?.[0]) || 0
    if (latA !== latB) {
      return latB - latA
    }
    const daqiA = stationDaqi({ station: a, ...daqiContext }) ?? 0
    const daqiB = stationDaqi({ station: b, ...daqiContext }) ?? 0
    return daqiA - daqiB
  })
  sortByLatThenDaqi.forEach((station) => {
    if (!hasValidCoords(station)) {
      return
    }
    const id = stationMarkerId(station)
    if (id === panelState.selectedMarkerId) {
      return
    }
    if (stationMatchesFilter(station)) {
      map.addMarker(
        id,
        stationMapCoords(station),
        daqiMarkerOptions(stationDaqi({ station, ...daqiContext }), false)
      )
    } else {
      map.removeMarker(id)
    }
  })
}

/**
 * Populates the forecast day selector buttons from the loaded forecasts data.
 * The button matching today's day abbreviation is activated by default.
 * Selecting a day updates selectedForecastDay and re-plots all markers.
 * @param {Function} onDayChange - called to re-plot markers when the day changes
 */
function initForecastDayControls(onDayChange) {
  const dayGroup = document.getElementById('forecast-day-group')
  if (!dayGroup || forecasts.length === 0) {
    return
  }
  const days = forecasts[0]?.forecast?.map((f) => f.day) ?? []
  days.forEach((day) => {
    const btn = document.createElement('button')
    const isActive = day === selectedForecastDay
    btn.className =
      'aq-filter-panel__tab' + (isActive ? ` ${TAB_ACTIVE_CLASS}` : '')
    btn.setAttribute(ARIA_PRESSED, String(isActive))
    btn.dataset.day = day
    btn.innerHTML = `<span>${day}</span>`
    btn.addEventListener('click', () => {
      dayGroup.querySelectorAll('button').forEach((b) => {
        b.setAttribute(ARIA_PRESSED, 'false')
        b.classList.remove(TAB_ACTIVE_CLASS)
      })
      btn.setAttribute(ARIA_PRESSED, 'true')
      btn.classList.add(TAB_ACTIVE_CLASS)
      selectedForecastDay = day
      onDayChange()
    })
    dayGroup.appendChild(btn)
  })
}

// Plot all station markers and initialise map UI on first render.
map.on('map:firstidle', () => {
  initKeyOverlay()
  initReopenStack()
  initStationPanelKeyboard()
  initMarkerObserver()
  initMapMouseInteraction()
  plotAllMarkers()
  initFilterPanel(plotAllMarkers)
  initForecastDayControls(plotAllMarkers)
  document.getElementById('exit-map')?.addEventListener('click', () => {
    history.back()
  })
})

// On map click (canvas), find the nearest plotted station within ~11 km (0.1°) and select it.
// Note: clicking directly on a station marker (DOM overlay) does not fire map:click —
// that case is handled by the keyboard/marker listeners in map-marker-accessibility.js.
map.on('map:click', (evt) => {
  if (!evt?.coords) {
    return
  }
  const [clickLng, clickLat] = evt.coords
  let best = null
  let bestDist = Infinity
  sortedStationsByLat.forEach((station) => {
    if (!hasValidCoords(station) || !isActiveStation(station)) {
      return
    }
    const lat = Number.parseFloat(station.location.coordinates[0])
    const lng = Number.parseFloat(station.location.coordinates[1])
    const squaredDist = (lng - clickLng) ** 2 + (lat - clickLat) ** 2
    if (squaredDist < bestDist) {
      bestDist = squaredDist
      best = station
    }
  })
  // sqrt(CLICK_SELECT_MAX_SQUARED_DEG) ≈ 0.1 degrees ≈ 11 km — reasonable click target at mid zoom
  if (best && bestDist < CLICK_SELECT_MAX_SQUARED_DEG) {
    highlightStation(best)
  }
})

/**
 * Navigates the map to a station: highlights it and shows the station panel.
 * Exposed on window so station-list.js can trigger map navigation.
 * @param {object} station
 */
globalThis.navigateToStation = function (station) {
  highlightStation(station)
}

document
  .getElementById('sp-close')
  ?.addEventListener('click', closeStationPanel)

// The visible trigger is a link (not a button) to match existing styling,
// but it submits the hidden form rather than navigating via href.
document
  .getElementById('sp-station-link')
  ?.addEventListener('click', (event) => {
    event.preventDefault()
    document.getElementById('sp-station-form')?.submit()
  })

export { map }
