// @vitest-environment jsdom
import { vi, beforeEach, describe, test, expect } from 'vitest'
import { filterState, initFilterPanel } from './map-filter-panel.js'

const ARIA_PRESSED = 'aria-pressed'

function buildDom() {
  document.body.innerHTML = `
    <div id="filter-panel" tabindex="-1">
      <button id="filter-panel-close"></button>
      <button id="map-type-aurn" class="aq-filter-panel__tab aq-filter-panel__tab--active" aria-pressed="true"><span>Monitoring stations</span></button>
      <button id="map-type-forecast" class="aq-filter-panel__tab" aria-pressed="false"><span>Forecast</span></button>
      <div id="pollutant-filter-controls">
        <button id="filter-tab-daqi" class="aq-filter-panel__tab aq-filter-panel__tab--active" aria-pressed="true"><span>DAQI pollutants</span></button>
        <button id="filter-tab-other" class="aq-filter-panel__tab" aria-pressed="false"><span>Other pollutants</span></button>
        <div class="aq-filter-panel__scroll">
          <div id="filter-daqi-content"></div>
          <div id="filter-other-content" hidden></div>
        </div>
      </div>
      <div id="forecast-day-controls" hidden></div>
    </div>
    <button id="filter-button" aria-expanded="true"></button>
  `
}

describe('map-filter-panel — map type toggle', () => {
  let onFilterChange

  beforeEach(() => {
    buildDom()
    onFilterChange = vi.fn()
    filterState.mapMode = 'aurn'
    initFilterPanel(onFilterChange)
  })

  test('clicking Forecast tab sets mapMode to forecast', () => {
    document.getElementById('map-type-forecast').click()
    expect(filterState.mapMode).toBe('forecast')
  })

  test('clicking Forecast tab sets aria-pressed correctly', () => {
    document.getElementById('map-type-forecast').click()
    expect(
      document.getElementById('map-type-forecast').getAttribute(ARIA_PRESSED)
    ).toBe('true')
    expect(
      document.getElementById('map-type-aurn').getAttribute(ARIA_PRESSED)
    ).toBe('false')
  })

  test('clicking Forecast tab hides pollutant controls and shows forecast day controls', () => {
    document.getElementById('map-type-forecast').click()
    expect(document.getElementById('pollutant-filter-controls').hidden).toBe(
      true
    )
    expect(document.getElementById('forecast-day-controls').hidden).toBe(false)
  })

  test('clicking Forecast tab updates active class', () => {
    document.getElementById('map-type-forecast').click()
    expect(
      document
        .getElementById('map-type-forecast')
        .classList.contains('aq-filter-panel__tab--active')
    ).toBe(true)
    expect(
      document
        .getElementById('map-type-aurn')
        .classList.contains('aq-filter-panel__tab--active')
    ).toBe(false)
  })

  test('clicking Forecast tab calls onFilterChange', () => {
    document.getElementById('map-type-forecast').click()
    expect(onFilterChange).toHaveBeenCalledTimes(1)
  })

  test('clicking Monitoring stations tab sets mapMode to aurn', () => {
    filterState.mapMode = 'forecast'
    document.getElementById('map-type-aurn').click()
    expect(filterState.mapMode).toBe('aurn')
  })

  test('clicking Monitoring stations tab sets aria-pressed correctly', () => {
    document.getElementById('map-type-forecast').click()
    document.getElementById('map-type-aurn').click()
    expect(
      document.getElementById('map-type-aurn').getAttribute(ARIA_PRESSED)
    ).toBe('true')
    expect(
      document.getElementById('map-type-forecast').getAttribute(ARIA_PRESSED)
    ).toBe('false')
  })

  test('clicking Monitoring stations tab shows pollutant controls and hides forecast day controls', () => {
    document.getElementById('map-type-forecast').click()
    document.getElementById('map-type-aurn').click()
    expect(document.getElementById('pollutant-filter-controls').hidden).toBe(
      false
    )
    expect(document.getElementById('forecast-day-controls').hidden).toBe(true)
  })

  test('clicking Monitoring stations tab calls onFilterChange', () => {
    document.getElementById('map-type-aurn').click()
    expect(onFilterChange).toHaveBeenCalled()
  })
})
