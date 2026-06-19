// @vitest-environment jsdom
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

const defaultZoom = 5.4842222
const ukCentreLng = -1.4649
const ukCentreLat = 52.5619
const openFreeMapStyleUrl = 'https://tiles.openfreemap.org/styles/liberty'

let InteractiveMap
let mockMaplibreProvider
let mockMapInstance
let mapReadyCallback
let mapClickCallback

/**
 * Stubs fetch to return separate responses for stations and forecasts endpoints.
 */
function stubFetch({ stations = [], forecasts = [] } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url) => {
      if (url === '/api/monitoring-stations') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ stations })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(forecasts)
      })
    })
  )
}

/**
 * Resets the DOM to clear all accumulated event listeners from previous imports.
 * Must be called before each re-import in test helpers.
 */
function resetDom() {
  document.body.innerHTML = `
    <div id="map"></div>
    <div id="map-key-overlay" class="aq-map-key" role="region" aria-label="Map key"></div>
    <div class="reopen-stack" aria-label="Map actions"></div>
    <div id="station-panel">
      <button id="sp-close"></button>
      <h2 id="sp-name"></h2>
      <dl id="sp-details"></dl>
    </div>
  `
}

beforeEach(async () => {
  mapReadyCallback = null
  mapClickCallback = null

  // Set up DOM elements the map module interacts with
  document.body.innerHTML = `
    <div id="map"></div>
    <div id="map-key-overlay" class="aq-map-key" role="region" aria-label="Map key"></div>
    <div class="reopen-stack" aria-label="Map actions"></div>
    <div id="station-panel">
      <button id="sp-close"></button>
      <h2 id="sp-name"></h2>
      <dl id="sp-details"></dl>
    </div>
  `

  mockMapInstance = {
    on: vi.fn((event, cb) => {
      if (event === 'map:firstidle') mapReadyCallback = cb
      if (event === 'map:click') mapClickCallback = cb
    }),
    addMarker: vi.fn()
  }
  InteractiveMap = vi.fn().mockImplementation(function () {
    return mockMapInstance
  })
  mockMaplibreProvider = vi.fn().mockReturnValue('maplibreProvider')
  vi.stubGlobal('defra', {
    InteractiveMap,
    maplibreProvider: mockMaplibreProvider
  })
  stubFetch()
  vi.resetModules()
  await import('./map.js')
})

describe('#map initialisation', () => {
  test('Should create an InteractiveMap with the UK centre coordinates', () => {
    expect(InteractiveMap).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        center: [ukCentreLng, ukCentreLat],
        zoom: defaultZoom
      })
    )
  })

  test('Should use the maplibre provider', () => {
    expect(mockMaplibreProvider).toHaveBeenCalled()
    expect(InteractiveMap).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        mapProvider: 'maplibreProvider'
      })
    )
  })

  test('Should configure the OpenFreeMap tile style', () => {
    expect(InteractiveMap).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        mapStyle: expect.objectContaining({
          url: openFreeMapStyleUrl
        })
      })
    )
  })

  test('Should set container height to 100%', () => {
    expect(InteractiveMap).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        containerHeight: '100%'
      })
    )
  })

  test('Should register a map:firstidle event listener', () => {
    expect(mockMapInstance.on).toHaveBeenCalledWith(
      'map:firstidle',
      expect.any(Function)
    )
  })

  test('Should fetch monitoring stations on load', () => {
    expect(fetch).toHaveBeenCalledWith('/api/monitoring-stations')
  })

  test('Should fetch forecasts on load', () => {
    expect(fetch).toHaveBeenCalledWith('/api/forecasts')
  })
})

describe('#monitoring stations', () => {
  test('Should add markers when map:firstidle fires', async () => {
    const stations = [
      { localSiteID: 'UKA001', location: { coordinates: [51.5, -0.1] } }
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stations })
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA001',
      [-0.1, 51.5],
      expect.objectContaining({ viewBox: '0 0 38 38', anchor: [0.5, 0.5] })
    )
  })

  test('Should convert [lat, lng] from API to [lng, lat] for the map', async () => {
    const stations = [
      {
        localSiteID: 'UKA001',
        location: { coordinates: [51.49492, -0.180564] }
      }
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stations })
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA001',
      [-0.180564, 51.49492],
      expect.any(Object)
    )
  })

  test('Should use ms-{localSiteID} as the marker id', async () => {
    const stations = [
      { localSiteID: 'MY_SITE', location: { coordinates: [53, -2] } }
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stations })
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker.mock.calls[0][0]).toBe('ms-MY_SITE')
    expect(mockMapInstance.addMarker.mock.calls[0][2]).toMatchObject({
      viewBox: '0 0 38 38'
    })
  })

  test('Should skip stations with missing location', async () => {
    const stations = [
      { localSiteID: 'NOLOC' },
      { localSiteID: 'UKA002', location: { coordinates: [52, -1] } }
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stations })
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledTimes(1)
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA002',
      [-1, 52],
      expect.objectContaining({ viewBox: '0 0 38 38' })
    )
  })

  test('Should skip stations with null location', async () => {
    const stations = [
      { localSiteID: 'UKA001', location: null },
      { localSiteID: 'UKA002', location: { coordinates: [52, -1] } }
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stations })
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledTimes(1)
  })

  test('Should skip stations with non-array coordinates', async () => {
    const stations = [
      { localSiteID: 'UKA001', location: { coordinates: 'invalid' } },
      { localSiteID: 'UKA002', location: { coordinates: [52, -1] } }
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ stations })
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledTimes(1)
  })

  test('Should not add markers when fetch returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).not.toHaveBeenCalled()
  })

  test('Should not throw when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error'))
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.resetModules()
    await expect(import('./map.js')).resolves.not.toThrow()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to load monitoring stations',
      expect.any(Error)
    )
    warnSpy.mockRestore()
  })

  test('Should handle a response with no stations property', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      })
    )
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    expect(mockMapInstance.addMarker).not.toHaveBeenCalled()
  })
})

async function loadWithForecasts(stations, forecasts) {
  resetDom()
  stubFetch({ stations, forecasts })
  vi.resetModules()
  await import('./map.js')
  mapReadyCallback()
}

async function loadStationsAndIdle(stationList) {
  resetDom()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ stations: stationList })
    })
  )
  vi.resetModules()
  await import('./map.js')
  mapReadyCallback()
}

async function loadStationsAndIdleWithForecasts(stationList, forecasts) {
  resetDom()
  stubFetch({ stations: stationList, forecasts })
  vi.resetModules()
  await import('./map.js')
  mapReadyCallback()
}

describe('#DAQI markers', () => {
  const station = {
    localSiteID: 'UKA001',
    location: { coordinates: [51.5, -0.1] }
  }
  const forecastAt = (lat, lng, value) => [
    { location: { coordinates: [lat, lng] }, forecast: [{ value }] }
  ]

  test('Should colour marker green for DAQI 1–3', async () => {
    await loadWithForecasts([station], forecastAt(51.5, -0.1, 2))
    const call = mockMapInstance.addMarker.mock.calls[0]
    expect(call[2].symbolSvgContent).toContain('#00703c')
    expect(call[2].symbolSvgContent).toContain('>2<')
  })

  test('Should colour marker yellow for DAQI 4–6', async () => {
    await loadWithForecasts([station], forecastAt(51.5, -0.1, 5))
    const call = mockMapInstance.addMarker.mock.calls[0]
    expect(call[2].symbolSvgContent).toContain('#ffdd00')
    expect(call[2].symbolSvgContent).toContain('>5<')
  })

  test('Should use dark text on yellow DAQI marker', async () => {
    await loadWithForecasts([station], forecastAt(51.5, -0.1, 5))
    const call = mockMapInstance.addMarker.mock.calls[0]
    // Yellow background → text fill must be dark
    expect(call[2].symbolSvgContent).toContain('fill="#0b0c0c"')
  })

  test('Should colour marker red for DAQI 7–9', async () => {
    await loadWithForecasts([station], forecastAt(51.5, -0.1, 8))
    const call = mockMapInstance.addMarker.mock.calls[0]
    expect(call[2].symbolSvgContent).toContain('#d4351c')
  })

  test('Should colour marker black for DAQI 10', async () => {
    await loadWithForecasts([station], forecastAt(51.5, -0.1, 10))
    const call = mockMapInstance.addMarker.mock.calls[0]
    expect(call[2].symbolSvgContent).toContain('fill="#0b0c0c"')
  })

  test('Should use grey marker when no forecast is close enough', async () => {
    // Forecast is > 0.05 degrees away
    await loadWithForecasts([station], forecastAt(52, -0.1, 5))
    const call = mockMapInstance.addMarker.mock.calls[0]
    expect(call[2].symbolSvgContent).toContain('fill="#777777"')
    expect(call[2].symbolSvgContent).toContain('stroke="white"')
  })

  test('Should use grey marker when no forecasts are available', async () => {
    await loadWithForecasts([station], [])
    const call = mockMapInstance.addMarker.mock.calls[0]
    expect(call[2].symbolSvgContent).toContain('fill="#777777"')
  })

  test('Should use dark grey with black stroke for selected station with no DAQI', async () => {
    await loadWithForecasts([station], [])
    mapClickCallback({ coords: [-0.1, 51.5] })
    const markerCalls = mockMapInstance.addMarker.mock.calls
    const selectedCall = markerCalls.find(
      (call) =>
        call[0] === 'ms-UKA001' && call[2].symbolSvgContent.includes('#0b0c0c')
    )
    expect(selectedCall).toBeDefined()
    expect(selectedCall[2].symbolSvgContent).toContain('fill="#555555"')
  })

  test('Should not assign DAQI to a closed station', async () => {
    const closedStation = { ...station, stationStatus: 'closed' }
    await loadWithForecasts([closedStation], forecastAt(51.5, -0.1, 5))
    const call = mockMapInstance.addMarker.mock.calls[0]
    // Closed → DAQI null → grey, no DAQI label
    expect(call[2].symbolSvgContent).toContain('fill="#777777"')
    expect(call[2].symbolSvgContent).not.toContain('#ffdd00')
  })
})

describe('#station panel', () => {
  const station = {
    localSiteID: 'UKA001',
    name: 'London Test',
    localAuthority: 'Greater London',
    areaType: 'Urban Background',
    openDate: '2000-01-15',
    stationStatus: 'current',
    pollutants: ['NO2', 'PM10'],
    location: { coordinates: [51.5, -0.1] }
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('Should show station panel when clicking near a station', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(
      document.getElementById('station-panel').classList.contains('visible')
    ).toBe(true)
  })

  test('Should populate station name in the panel', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(document.getElementById('sp-name').textContent).toContain(
      'London Test'
    )
  })

  test('Should populate station details in the panel', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(document.getElementById('sp-details').textContent).toContain(
      'Greater London'
    )
    expect(document.getElementById('sp-details').textContent).toContain(
      'Urban Background'
    )
  })

  test('Should render the selected marker with a distinct style', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [-0.1, 51.5] })
    const markerCalls = mockMapInstance.addMarker.mock.calls
    const selectedCall = markerCalls.find(
      (call) =>
        call[0] === 'ms-UKA001' && call[2].symbolSvgContent.includes('#0b0c0c')
    )
    expect(selectedCall).toBeDefined()
  })

  test('Should restore the previous marker when a new station is selected', async () => {
    const station2 = {
      localSiteID: 'UKA002',
      name: 'Manchester Test',
      location: { coordinates: [53.5, -2.2] }
    }
    await loadStationsAndIdle([station, station2])
    mapClickCallback({ coords: [-0.1, 51.5] })
    mockMapInstance.addMarker.mockClear()
    mapClickCallback({ coords: [-2.2, 53.5] })
    // First call restores UKA001 to default style
    expect(mockMapInstance.addMarker.mock.calls[0][0]).toBe('ms-UKA001')
    expect(
      mockMapInstance.addMarker.mock.calls[0][2].symbolSvgContent
    ).toContain('stroke="white"')
  })

  test('Should not show panel when clicking outside the 0.1 degree radius', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [5, 60] })
    expect(
      document.getElementById('station-panel').classList.contains('visible')
    ).toBe(false)
  })

  test('Should hide panel and restore marker when close button is clicked', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(
      document.getElementById('station-panel').classList.contains('visible')
    ).toBe(true)
    mockMapInstance.addMarker.mockClear()
    document.getElementById('sp-close').click()
    expect(
      document.getElementById('station-panel').classList.contains('visible')
    ).toBe(false)
    // Marker restored to default
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA001',
      expect.any(Array),
      expect.objectContaining({
        symbolSvgContent: expect.stringContaining('stroke="white"')
      })
    )
  })

  test('Should do nothing on map:click when evt has no coords', async () => {
    await loadStationsAndIdle([station])
    mapReadyCallback()
    mockMapInstance.addMarker.mockClear()
    mapClickCallback({})
    expect(
      document.getElementById('station-panel').classList.contains('visible')
    ).toBe(false)
  })

  test('Should show DAQI row in the panel when a forecast is available', async () => {
    const forecast = [
      { location: { coordinates: [51.5, -0.1] }, forecast: [{ value: 3 }] }
    ]
    await loadStationsAndIdleWithForecasts([station], forecast)
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(document.getElementById('sp-details').textContent).toContain('DAQI')
    expect(document.getElementById('sp-details').textContent).toContain('3')
    expect(document.getElementById('sp-details').textContent).toContain('low')
  })

  test('Should not show DAQI row in the panel for a closed station', async () => {
    const closedStation = { ...station, stationStatus: 'closed' }
    const forecast = [
      { location: { coordinates: [51.5, -0.1] }, forecast: [{ value: 5 }] }
    ]
    await loadStationsAndIdleWithForecasts([closedStation], forecast)
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(document.getElementById('sp-details').textContent).not.toContain(
      'DAQI'
    )
  })

  test('Should hide the map key overlay when the station panel opens', async () => {
    await loadStationsAndIdle([station])
    const overlay = document.getElementById('map-key-overlay')
    expect(overlay.hidden).toBe(false)
    mapClickCallback({ coords: [-0.1, 51.5] })
    expect(overlay.hidden).toBe(true)
  })

  test('Should show the map key overlay when the station panel closes', async () => {
    await loadStationsAndIdle([station])
    mapClickCallback({ coords: [-0.1, 51.5] })
    document.getElementById('sp-close').click()
    expect(document.getElementById('map-key-overlay').hidden).toBe(false)
  })

  test('Should not reopen map key when user dismissed it before closing the panel', async () => {
    await loadStationsAndIdle([station])
    // User explicitly closes the key overlay
    document.getElementById('map-key-close').click()
    mapClickCallback({ coords: [-0.1, 51.5] })
    document.getElementById('sp-close').click()
    // Key should remain hidden
    expect(document.getElementById('map-key-overlay').hidden).toBe(true)
  })
})

async function loadAndIdle() {
  resetDom()
  stubFetch()
  vi.resetModules()
  await import('./map.js')
  mapReadyCallback()
}

describe('#map key overlay', () => {
  test('Should populate key overlay content on map:firstidle', async () => {
    await loadAndIdle()
    const overlay = document.getElementById('map-key-overlay')
    expect(overlay.querySelector('#map-key-close')).toBeDefined()
    expect(overlay.textContent).toContain('Map key')
    expect(overlay.textContent).toContain('DAQI')
  })

  test('Should render DAQI scale bands 1–10', async () => {
    await loadAndIdle()
    const body = document.getElementById('map-key-body')
    expect(body.textContent).toContain('1')
    expect(body.textContent).toContain('10')
    expect(body.textContent).toContain('Low')
    expect(body.textContent).toContain('Very high')
  })

  test('Should hide key overlay when close button is clicked', async () => {
    await loadAndIdle()
    const overlay = document.getElementById('map-key-overlay')
    document.getElementById('map-key-close').click()
    expect(overlay.hidden).toBe(true)
  })

  test('Should initialise key toggle button in reopen stack', async () => {
    await loadAndIdle()
    expect(document.getElementById('key-button')).not.toBeNull()
    expect(document.querySelector('.reopen-stack').textContent).toContain('Key')
  })

  test('Should hide key overlay via key button when it is visible', async () => {
    await loadAndIdle()
    const overlay = document.getElementById('map-key-overlay')
    expect(overlay.hidden).toBe(false)
    document.getElementById('key-button').click()
    expect(overlay.hidden).toBe(true)
  })

  test('Should show key overlay via key button when it is hidden', async () => {
    await loadAndIdle()
    const overlay = document.getElementById('map-key-overlay')
    overlay.hidden = true
    document.getElementById('key-button').click()
    expect(overlay.hidden).toBe(false)
  })

  test('Should expose globalThis.navigateToStation', async () => {
    const station = {
      localSiteID: 'UKA001',
      name: 'Test Station',
      stationStatus: 'current',
      location: { coordinates: [51.5, -0.1] }
    }
    stubFetch({ stations: [station] })
    vi.resetModules()
    await import('./map.js')
    mapReadyCallback()
    globalThis.navigateToStation(station)
    // highlightStation was called: marker updated to selected style
    const markerCalls = mockMapInstance.addMarker.mock.calls
    const selectedCall = markerCalls.find(
      (call) =>
        call[0] === 'ms-UKA001' && call[2].symbolSvgContent.includes('#0b0c0c')
    )
    expect(selectedCall).toBeDefined()
  })
})
