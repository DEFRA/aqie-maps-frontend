const ARIA_PRESSED = 'aria-pressed'

const filterState = {
  mode: 'daqi',
  selected: new Set(['NO2', 'O3', 'SO2', 'PM25', 'PM10'])
}

let showInactiveStations = true

/**
 * Returns true when a station's status indicates it is currently active.
 * @param {object} station
 * @returns {boolean}
 */
function stationIsActive(station) {
  const st = (
    station.stationStatus ||
    station.status ||
    station.siteStatus ||
    ''
  ).toLowerCase()
  return !st || st === 'current' || st === 'active'
}

/**
 * Returns true if the station should be shown given the current filter state.
 * Stations with no pollutant data are always shown (data may not have loaded yet).
 * @param {object} station
 * @returns {boolean}
 */
function stationMatchesFilter(station) {
  if (!showInactiveStations && !stationIsActive(station)) {
    return false
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
 * Wires up the filter panel tabs, checkboxes and open/close behaviour.
 * The HTML for the panel content is pre-rendered server-side by Nunjucks;
 * this function only shows, hides and reads DOM state.
 * @param {Function} onFilterChange - called to re-plot markers when the filter changes
 */
/**
 * Collapses the filter panel and updates the toggle button state.
 * @param {HTMLElement} panel
 * @param {HTMLElement} reopenBtn
 */
function closeFilterPanel(panel, reopenBtn) {
  panel.hidden = true
  reopenBtn.setAttribute('aria-expanded', 'false')
  reopenBtn.focus()
}

/**
 * Expands the filter panel and updates the toggle button state.
 * @param {HTMLElement} panel
 * @param {HTMLElement} reopenBtn
 */
function openFilterPanel(panel, reopenBtn) {
  panel.hidden = false
  reopenBtn.setAttribute('aria-expanded', 'true')
  panel.focus()
}

/**
 * Wires up the filter panel tabs, checkboxes and open/close behaviour.
 * The HTML for the panel content is pre-rendered server-side by Nunjucks;
 * this function only shows, hides and reads DOM state.
 * @param {Function} onFilterChange - called to re-plot markers when the filter changes
 */
function initFilterPanel(onFilterChange) {
  const panel = document.getElementById('filter-panel')
  if (!panel) {
    return
  }
  const reopenBtn = document.getElementById('filter-button')
  const tabDaqi = document.getElementById('filter-tab-daqi')
  const tabOther = document.getElementById('filter-tab-other')
  const daqiContent = document.getElementById('filter-daqi-content')
  const otherContent = document.getElementById('filter-other-content')
  document
    .getElementById('filter-panel-close')
    .addEventListener('click', () => closeFilterPanel(panel, reopenBtn))
  reopenBtn?.addEventListener('click', () => {
    if (panel.hidden) {
      openFilterPanel(panel, reopenBtn)
    } else {
      closeFilterPanel(panel, reopenBtn)
    }
  })
  tabDaqi.addEventListener('click', () => {
    filterState.mode = 'daqi'
    tabDaqi.setAttribute(ARIA_PRESSED, 'true')
    tabOther.setAttribute(ARIA_PRESSED, 'false')
    if (daqiContent) {
      daqiContent.hidden = false
    }
    if (otherContent) {
      otherContent.hidden = true
    }
    onFilterChange()
  })
  tabOther.addEventListener('click', () => {
    filterState.mode = 'other'
    tabOther.setAttribute(ARIA_PRESSED, 'true')
    tabDaqi.setAttribute(ARIA_PRESSED, 'false')
    if (daqiContent) {
      daqiContent.hidden = true
    }
    if (otherContent) {
      otherContent.hidden = false
    }
    onFilterChange()
  })
  const scroll = document.querySelector('.aq-filter-panel__scroll')
  if (scroll) {
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
      onFilterChange()
    })
  }
}

export { filterState, stationMatchesFilter, initFilterPanel }
