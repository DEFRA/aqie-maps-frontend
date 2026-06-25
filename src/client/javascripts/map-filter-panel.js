const ARIA_PRESSED = 'aria-pressed'

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
 * Builds the HTML for a single pollutant checkbox item.
 * @param {{ label: string, codes: string[] }} pollutant
 * @param {number} i
 * @returns {string}
 */
function renderFilterItem(pollutant, i) {
  const id = `filter-pollutant-${i}`
  const checked = pollutant.codes.every((code) =>
    filterState.selected.has(code)
  )
  return `<div class="govuk-checkboxes__item"><input class="govuk-checkboxes__input" id="${id}" type="checkbox" value="${pollutant.codes.join(',')}"${checked ? ' checked' : ''}><label class="govuk-label govuk-checkboxes__label" for="${id}">${pollutant.label}</label></div>`
}

/**
 * Renders the Data sources and Map features collapsible sections.
 */
function renderFilterSections() {
  const sections = document.getElementById('filter-sections')
  if (!sections) {
    return
  }
  const inactiveChecked = showInactiveStations ? ' checked' : ''
  sections.innerHTML = `<details class="govuk-details govuk-!-margin-top-3 govuk-!-margin-bottom-0"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Data sources</span></summary><div class="govuk-details__text"><p class="govuk-body-s govuk-!-margin-bottom-0">Automatic Urban and Rural Network (AURN)</p></div></details><details class="govuk-details govuk-!-margin-top-2 govuk-!-margin-bottom-0"><summary class="govuk-details__summary"><span class="govuk-details__summary-text">Map features</span></summary><div class="govuk-details__text"><div class="govuk-checkboxes govuk-checkboxes--small"><div class="govuk-checkboxes__item"><input class="govuk-checkboxes__input" id="filter-show-inactive" type="checkbox"${inactiveChecked}><label class="govuk-label govuk-checkboxes__label" for="filter-show-inactive">Show closed and inactive stations</label></div></div></div></details>`
}

/**
 * Renders the DAQI pollutant checkboxes into the filter panel.
 * @param {Function} onFilterChange - called to re-plot markers when the filter changes
 */
function renderFilterDaqi(onFilterChange) {
  const mount = document.getElementById('filter-mount')
  if (!mount) {
    return
  }
  const items = DAQI_POLLUTANTS.map((pollutant, i) => renderFilterItem(pollutant, i)).join('')
  mount.innerHTML = `<fieldset class="govuk-fieldset"><legend class="govuk-visually-hidden">Select pollutants to display on the map</legend><div class="govuk-checkboxes govuk-checkboxes--small">${items}</div></fieldset>`
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
      onFilterChange()
    })
    scroll.dataset.filterBound = 'true'
  }
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
 * @param {Function} onFilterChange - called to re-plot markers when the filter changes
 */
function initFilterPanel(onFilterChange) {
  const panel = document.getElementById('filter-panel')
  if (!panel) {
    return
  }
  renderFilterDaqi(onFilterChange)
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
    tabDaqi.setAttribute(ARIA_PRESSED, 'true')
    tabOther.setAttribute(ARIA_PRESSED, 'false')
    renderFilterDaqi(onFilterChange)
    onFilterChange()
  })
  tabOther.addEventListener('click', () => {
    filterState.mode = 'other'
    tabOther.setAttribute(ARIA_PRESSED, 'true')
    tabDaqi.setAttribute(ARIA_PRESSED, 'false')
    renderFilterOther()
    onFilterChange()
  })
}

export { filterState, stationMatchesFilter, initFilterPanel }
