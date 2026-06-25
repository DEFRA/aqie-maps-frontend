/* global defra, history */

const defaultZoom = 5.4842222
const ukCentreLng = -1.4649
const ukCentreLat = 52.5619

// Maximum distance (degrees) between a station and a forecast point to be considered a match.
const FORECAST_MATCH_RADIUS_DEG = 0.05

// Maximum squared distance (degrees²) for a map click to select a station (~11 km at mid zoom).
const CLICK_SELECT_MAX_SQUARED_DEG = 0.01

const DAQI_POLLUTANTS = [
  { label: 'Fine particulate matter (PM2.5)', codes: ['PM25'] },
  { label: 'Particulate matter (PM10)', codes: ['PM10'] },
  { label: 'Nitrogen dioxide (NO2)', codes: ['NO2'] },
  { label: 'Ozone (O3)', codes: ['O3'] },
  { label: 'Sulphur dioxide (SO2)', codes: ['SO2'] }
]

const filterState = {
  mode: 'daqi',
  selected: new Set(['NO2', 'O3', 'SO2', 'PM25', 'PM10'])
}

let showInactiveStations = true

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

/**
 * Returns the marker id for a station.
 * @param {{ localSiteID: string }} station
 * @returns {string}
 */
function stationMarkerId(station) {
  return `ms-${station.localSiteID}`
}

/**
 * Converts API coordinates [lat, lng] to the [lng, lat] order the map expects.
 * @param {{ location: { coordinates: [number, number] } }} station
 * @returns {[number, number]}
 */
function stationMapCoords(station) {
  const coords = station.location.coordinates
  return [Number.parseFloat(coords[1]), Number.parseFloat(coords[0])]
}

/**
 * Returns true only when a station has a plottable coordinate pair.
 * Stations missing location data or with non-finite values are skipped.
 * @param {{ location?: { coordinates?: unknown } }} station
 * @returns {boolean}
 */
function hasValidCoords(station) {
  const coords = station.location?.coordinates
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false
  }
  if (!Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) {
    return false
  }
  return true
}

// DAQI background colours indexed by DAQI value (1–10); index 0 is unused.
// Yellow (#ffdd00) values 4–6 need dark text.
const daqiBg = [
  null,
  '#00703c',
  '#00703c',
  '#00703c',
  '#ffdd00',
  '#ffdd00',
  '#ffdd00',
  '#d4351c',
  '#d4351c',
  '#d4351c',
  '#0b0c0c'
]

const daqiBand = [
  null,
  'Low',
  'Low',
  'Low',
  'Moderate',
  'Moderate',
  'Moderate',
  'High',
  'High',
  'High',
  'Very High'
]

/**
 * Builds SVG marker options coloured by DAQI value.
 * Falls back to grey when no DAQI value is available.
 * @param {number|null} daqiValue - DAQI index 1–10, or null
 * @param {boolean} selected
 * @returns {{ symbolSvgContent: string, viewBox: string, anchor: [number, number] }}
 */
function daqiMarkerOptions(daqiValue, selected) {
  let bg
  if (daqiValue && daqiBg[daqiValue]) {
    bg = daqiBg[daqiValue]
  } else if (selected) {
    bg = '#555555'
  } else {
    bg = '#777777'
  }
  const strokeAttr = selected
    ? 'stroke="#0b0c0c" stroke-width="2"'
    : 'stroke="white" stroke-width="2"'
  const textFill = bg === '#ffdd00' ? '#0b0c0c' : '#ffffff'
  const label = daqiValue
    ? `<text x="19" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="bold" fill="${textFill}">${daqiValue}</text>`
    : ''
  const shadow =
    '<defs><filter id="ds" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>' +
    '</filter></defs>'
  return {
    symbolSvgContent: `${shadow}<circle cx="19" cy="19" r="14" fill="${bg}" ${strokeAttr} filter="url(#ds)"/>${label}`,
    viewBox: '0 0 38 38',
    anchor: [0.5, 0.5]
  }
}

let stations = []
try {
  const response = await fetch('/api/monitoring-stations')
  if (response.ok) {
    const data = await response.json()
    stations = data.stations ?? []
  }
} catch (err) {
  console.warn('Failed to load monitoring stations', err)
}

let forecasts = []
try {
  const forecastResponse = await fetch('/api/forecasts')
  if (forecastResponse.ok) {
    const forecastData = await forecastResponse.json()
    forecasts = Array.isArray(forecastData)
      ? forecastData
      : (forecastData.forecasts ?? [])
  }
} catch (err) {
  console.warn('Failed to load forecasts', err)
}

/**
 * Finds the forecast entry whose location is nearest to the station, within 0.05 degrees.
 * @param {{ location: { coordinates: [number, number] } }} station
 * @returns {object|null}
 */
function forecastForStation(station) {
  if (!station.location) {
    return null
  }
  const sLat = Number.parseFloat(station.location.coordinates[0])
  const sLng = Number.parseFloat(station.location.coordinates[1])
  let best = null
  let bestDist = FORECAST_MATCH_RADIUS_DEG * FORECAST_MATCH_RADIUS_DEG
  forecasts.forEach((entry) => {
    if (!entry.location?.coordinates) {
      return
    }
    const fLat = Number.parseFloat(entry.location.coordinates[0])
    const fLng = Number.parseFloat(entry.location.coordinates[1])
    const dist = (fLat - sLat) ** 2 + (fLng - sLng) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = entry
    }
  })
  return best
}

/**
 * Returns today's DAQI value (1–10) for a station, or null if unavailable.
 * Closed stations always return null.
 * @param {{ stationStatus?: string, status?: string, siteStatus?: string }} station
 * @returns {number|null}
 */
function stationDaqi(station) {
  const status = (
    station.stationStatus ||
    station.status ||
    station.siteStatus ||
    ''
  ).toLowerCase()
  if (status === 'closed') {
    return null
  }
  const forecast = forecastForStation(station)
  if (
    forecast &&
    Array.isArray(forecast.forecast) &&
    forecast.forecast.length > 0
  ) {
    return forecast.forecast[0].value
  }
  return null
}

// Whether the user manually closed the key overlay (prevents auto-reopen on panel close).
let keyClosedByUser = false

const MAP_KEY_OVERLAY_ID = 'map-key-overlay'

/**
 * Shows the map key overlay.
 */
function showKeyOverlay() {
  const overlay = document.getElementById(MAP_KEY_OVERLAY_ID)
  if (overlay) {
    overlay.hidden = false
  }
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
  if (byUser) {
    keyClosedByUser = true
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
  document.getElementById('key-button')?.addEventListener('click', () => {
    const overlay = document.getElementById(MAP_KEY_OVERLAY_ID)
    if (overlay?.hidden) {
      keyClosedByUser = false
      showKeyOverlay()
    } else {
      hideKeyOverlay(true)
    }
  })
}

/**
 * Returns true if the station should be shown given the current filter state.
 * Stations with no pollutant data are always shown (data may not have loaded yet).
 * @param {object} station
 * @returns {boolean}
 */
function stationMatchesFilter(station) {
  if (!showInactiveStations) {
    const st = (
      station.stationStatus ||
      station.status ||
      station.siteStatus ||
      ''
    ).toLowerCase()
    if (st && st !== 'current' && st !== 'active') {
      return false
    }
  }
  if (filterState.mode === 'other') {
    return true
  }
  if (filterState.selected.size === 0) {
    return false
  }
  const pollutants = station.pollutants || []
  if (pollutants.length === 0) {
    return true
  }
  return pollutants.some((code) => filterState.selected.has(code))
}

/**
 * (Re)plots all markers that pass the current filter, removing any that no longer match.
 */
function plotAllMarkers() {
  stations.forEach((station) => {
    if (!hasValidCoords(station)) {
      return
    }
    const id = stationMarkerId(station)
    if (id === selectedMarkerId) {
      return
    }
    if (stationMatchesFilter(station)) {
      map.addMarker(
        id,
        stationMapCoords(station),
        daqiMarkerOptions(stationDaqi(station), false)
      )
    } else {
      map.removeMarker(id)
    }
  })
}

// Plot all station markers and initialise map UI on first render.
map.on('map:firstidle', () => {
  plotAllMarkers()
  initKeyOverlay()
  initReopenStack()
  initFilterPanel()
  document.getElementById('exit-map')?.addEventListener('click', () => {
    history.back()
  })
})

/**
 * Renders the DAQI pollutant checkboxes into the filter panel.
 */
function renderFilterDaqi() {
  const mount = document.getElementById('filter-mount')
  if (!mount) {
    return
  }
  const items = DAQI_POLLUTANTS.map((pollutant, i) => {
    const id = `filter-pollutant-${i}`
    const checked = pollutant.codes.every((code) =>
      filterState.selected.has(code)
    )
    return (
      `<div class="govuk-checkboxes__item">` +
      `<input class="govuk-checkboxes__input" id="${id}" type="checkbox" value="${pollutant.codes.join(',')}"${checked ? ' checked' : ''}>` +
      `<label class="govuk-label govuk-checkboxes__label" for="${id}">${pollutant.label}</label>` +
      `</div>`
    )
  }).join('')
  mount.innerHTML =
    '<fieldset class="govuk-fieldset">' +
    '<legend class="govuk-visually-hidden">Select pollutants to display on the map</legend>' +
    '<div class="govuk-checkboxes govuk-checkboxes--small">' +
    items +
    '</div>' +
    '</fieldset>'
  renderFilterSections()
  const scroll = document.querySelector('.aq-filter-panel__scroll')
  if (scroll && !scroll.dataset.filterBound) {
    scroll.addEventListener('change', (event) => {
      if (event.target?.type !== 'checkbox') {
        return
      }
      if (event.target.id === 'filter-show-inactive') {
        showInactiveStations = event.target.checked
      } else {
        const codes = event.target.value.split(',')
        if (event.target.checked) {
          codes.forEach((code) => filterState.selected.add(code))
        } else {
          codes.forEach((code) => filterState.selected.delete(code))
        }
      }
      plotAllMarkers()
    })
    scroll.dataset.filterBound = 'true'
  }
}

/**
 * Renders the Data sources and Map features collapsible sections.
 */
function renderFilterSections() {
  const sections = document.getElementById('filter-sections')
  if (!sections) {
    return
  }
  sections.innerHTML =
    '<details class="govuk-details govuk-!-margin-top-3 govuk-!-margin-bottom-0">' +
    '<summary class="govuk-details__summary"><span class="govuk-details__summary-text">Data sources</span></summary>' +
    '<div class="govuk-details__text">' +
    '<p class="govuk-body-s govuk-!-margin-bottom-0">Automatic Urban and Rural Network (AURN)</p>' +
    '</div>' +
    '</details>' +
    '<details class="govuk-details govuk-!-margin-top-2 govuk-!-margin-bottom-0">' +
    '<summary class="govuk-details__summary"><span class="govuk-details__summary-text">Map features</span></summary>' +
    '<div class="govuk-details__text">' +
    '<div class="govuk-checkboxes govuk-checkboxes--small">' +
    '<div class="govuk-checkboxes__item">' +
    `<input class="govuk-checkboxes__input" id="filter-show-inactive" type="checkbox"${showInactiveStations ? ' checked' : ''}>` +
    '<label class="govuk-label govuk-checkboxes__label" for="filter-show-inactive">Show closed and inactive stations</label>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</details>'
}

/**
 * Renders the "other pollutants" placeholder content.
 */
function renderFilterOther() {
  const mount = document.getElementById('filter-mount')
  if (!mount) {
    return
  }
  mount.innerHTML =
    '<p class="govuk-body-s govuk-!-margin-top-2">Other pollutant networks are not yet available.</p>'
  renderFilterSections()
}

/**
 * Wires up the filter panel tabs, checkboxes and open/close behaviour.
 */
function initFilterPanel() {
  const panel = document.getElementById('filter-panel')
  if (!panel) {
    return
  }
  renderFilterDaqi()
  const reopenBtn = document.getElementById('filter-button')
  const tabDaqi = document.getElementById('filter-tab-daqi')
  const tabOther = document.getElementById('filter-tab-other')
  document
    .getElementById('filter-panel-close')
    .addEventListener('click', () => {
      panel.hidden = true
      reopenBtn.hidden = false
      reopenBtn.focus()
    })
  reopenBtn?.addEventListener('click', () => {
    panel.hidden = false
    reopenBtn.hidden = true
    panel.focus()
  })
  tabDaqi.addEventListener('click', () => {
    filterState.mode = 'daqi'
    tabDaqi.setAttribute('aria-pressed', 'true')
    tabOther.setAttribute('aria-pressed', 'false')
    renderFilterDaqi()
    plotAllMarkers()
  })
  tabOther.addEventListener('click', () => {
    filterState.mode = 'other'
    tabOther.setAttribute('aria-pressed', 'true')
    tabDaqi.setAttribute('aria-pressed', 'false')
    renderFilterOther()
    plotAllMarkers()
  })
}

/**
 * Prevents XSS when setting innerHTML with user-sourced station data.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Formats an ISO date string to a human-readable en-GB date.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) {
    return ''
  }
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) {
    return dateStr
  }
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const NOT_AVAILABLE = 'Not available'

const pollutantLabels = {
  NO2: 'NO₂',
  O3: 'O₃',
  SO2: 'SO₂',
  PM25: 'PM2.5',
  PM10: 'PM10'
}

/**
 * Returns an HTML status tag string for the station name heading, or '' if no tag is needed.
 * @param {string} status - lowercased station status
 * @param {boolean} isClosed
 * @returns {string}
 */
function stationStatusTag(status, isClosed) {
  const tagLabel =
    status === 'current'
      ? 'Active'
      : status.charAt(0).toUpperCase() + status.slice(1)

  if (status === 'current') {
    return ` <strong class="aq-station-tag aq-station-tag--active">${escapeHtml(tagLabel)}</strong>`
  }
  if (isClosed) {
    return ` <strong class="aq-station-tag aq-station-tag--closed">${escapeHtml(tagLabel)}</strong>`
  }
  return ''
}

/**
 * Builds the DAQI detail row for the station panel, or null if unavailable.
 * @param {object} station
 * @returns {Array|null}
 */
function buildDaqiRow(station) {
  const forecast = forecastForStation(station)
  if (
    !forecast ||
    !Array.isArray(forecast.forecast) ||
    forecast.forecast.length === 0
  ) {
    return null
  }
  const todayValue = forecast.forecast[0].value
  const band = daqiBand[todayValue] || ''
  const bandKey = band.toLowerCase().replaceAll(' ', '')
  const daqiClass = bandKey
    ? `aq-daqi-tag aq-daqi-tag--${bandKey}`
    : 'aq-daqi-tag'
  const bandSuffix = band ? ` (${band.toLowerCase()})` : ''
  return [
    'DAQI',
    `<span class="${daqiClass}">${todayValue}${bandSuffix}</span>`,
    true
  ]
}

/**
 * Builds the rows array for the station details definition list.
 * @param {object} station
 * @param {boolean} isClosed
 * @returns {Array}
 */
function buildPanelRows(station, isClosed) {
  const rows = []

  const pollutants = station.pollutants || []
  if (pollutants.length > 0) {
    const seen = []
    pollutants.forEach((code) => {
      const label = pollutantLabels[code] || code
      if (!seen.includes(label)) {
        seen.push(label)
      }
    })
    rows.push(['Pollutants', seen.join(', ')])
  }

  if (!isClosed) {
    const daqiRow = buildDaqiRow(station)
    if (daqiRow) {
      rows.push(daqiRow)
    }
  }

  rows.push(['Local authority', station.localAuthority || NOT_AVAILABLE])
  if (station.areaType) {
    rows.push(['Site type', station.areaType])
  }
  rows.push([
    'Start date',
    station.openDate ? formatDate(station.openDate) : NOT_AVAILABLE
  ])
  const endDate = station.closeDate
    ? formatDate(station.closeDate)
    : NOT_AVAILABLE
  if (isClosed) {
    rows.push(['End date', endDate])
  }

  return rows
}

/**
 * Populates and shows the station panel for the given station.
 * @param {{ name?: string, stationStatus?: string, status?: string, siteStatus?: string,
 *   pollutants?: string[], localAuthority?: string, areaType?: string,
 *   openDate?: string, closeDate?: string }} station
 */
function showStationPanel(station) {
  const panel = document.getElementById('station-panel')
  if (!panel) {
    return
  }

  const status = (
    station.stationStatus ||
    station.status ||
    station.siteStatus ||
    ''
  ).toLowerCase()
  const isClosed = status === 'closed'

  document.getElementById('sp-name').innerHTML =
    escapeHtml(station.name || '') + stationStatusTag(status, isClosed)

  document.getElementById('sp-details').innerHTML = buildPanelRows(
    station,
    isClosed
  )
    .map(
      ([label, value, isHtml]) =>
        `<div class="aq-station-info-row"><dt>${escapeHtml(label)}:</dt> <dd>${isHtml ? value : escapeHtml(String(value))}</dd></div>`
    )
    .join('')

  panel.classList.add('visible')
  hideKeyOverlay(false)
}

let selectedMarkerId = null

/**
 * Restores the previously selected marker to its DAQI colour and hides the station panel.
 */
function closeStationPanel() {
  const panel = document.getElementById('station-panel')
  if (panel) {
    panel.classList.remove('visible')
  }
  if (selectedMarkerId) {
    const prev = stations.find((s) => stationMarkerId(s) === selectedMarkerId)
    if (prev) {
      map.addMarker(
        selectedMarkerId,
        stationMapCoords(prev),
        daqiMarkerOptions(stationDaqi(prev), false)
      )
    }
    selectedMarkerId = null
  }
  if (!keyClosedByUser) {
    showKeyOverlay()
  }
}

/**
 * Selects a station: restores the previous marker, highlights the new one, and shows the panel.
 * @param {object} station
 */
function highlightStation(station) {
  if (selectedMarkerId) {
    const prev = stations.find((s) => stationMarkerId(s) === selectedMarkerId)
    if (prev) {
      map.addMarker(
        selectedMarkerId,
        stationMapCoords(prev),
        daqiMarkerOptions(stationDaqi(prev), false)
      )
    }
  }
  selectedMarkerId = stationMarkerId(station)
  map.addMarker(
    selectedMarkerId,
    stationMapCoords(station),
    daqiMarkerOptions(stationDaqi(station), true)
  )
  showStationPanel(station)
}

// On map click (canvas), find the nearest plotted station within ~11 km (0.1°) and select it.
// Note: clicking directly on a station marker (DOM overlay) does not fire map:click —
// that case is handled by the delegated listener below.
map.on('map:click', (evt) => {
  if (!evt?.coords) {
    return
  }
  const [clickLng, clickLat] = evt.coords
  let best = null
  let bestDist = Infinity
  stations.forEach((station) => {
    if (!hasValidCoords(station)) {
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

export { map }
