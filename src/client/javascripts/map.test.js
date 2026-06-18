// @vitest-environment jsdom
import { vi, beforeEach, describe, test, expect } from 'vitest'

const defaultZoom = 5.4842222
const ukCentreLng = -1.4649
const ukCentreLat = 52.5619
const openFreeMapStyleUrl = 'https://tiles.openfreemap.org/styles/liberty'

let InteractiveMap
let mockMaplibreProvider
let mockMapInstance
let mapReadyCallback

beforeEach(async () => {
  mapReadyCallback = null
  mockMapInstance = {
    on: vi.fn((event, cb) => {
      if (event === 'map:firstidle') mapReadyCallback = cb
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
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ stations: [] })
    })
  )
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

  test('Should call loadMonitoringStations immediately on load', () => {
    expect(fetch).toHaveBeenCalledWith('/api/monitoring-stations')
  })
})

describe('#loadMonitoringStations', () => {
  test('Should add markers when map:ready fires after stations load', async () => {
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
    // wait for the fetch microtask to settle
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA001',
      [-0.1, 51.5],
      expect.objectContaining({ viewBox: '0 0 38 38', anchor: [0.5, 0.5] })
    )
  })

  test('Should add markers immediately when stations load after map:ready', async () => {
    let resolveFetch
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchPromise))
    vi.resetModules()
    await import('./map.js')
    // fire map:ready before fetch resolves
    mapReadyCallback()
    expect(mockMapInstance.addMarker).not.toHaveBeenCalled()
    // now resolve fetch
    resolveFetch({
      ok: true,
      json: vi
        .fn()
        .mockResolvedValue({
          stations: [
            { localSiteID: 'UKA001', location: { coordinates: [51.5, -0.1] } }
          ]
        })
    })
    await Promise.resolve()
    await Promise.resolve()
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA001',
      [-0.1, 51.5],
      expect.objectContaining({ viewBox: '0 0 38 38' })
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
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA001',
      [-0.180564, 51.49492],
      expect.any(Object)
    )
  })

  test('Should use ms-{localSiteID} as the marker id', async () => {
    const stations = [
      { localSiteID: 'MY_SITE', location: { coordinates: [53.0, -2.0] } }
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
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker.mock.calls[0][0]).toBe('ms-MY_SITE')
    expect(mockMapInstance.addMarker.mock.calls[0][2]).toMatchObject({
      viewBox: '0 0 38 38'
    })
  })

  test('Should skip stations with missing location', async () => {
    const stations = [
      { localSiteID: 'NOLOC' },
      { localSiteID: 'UKA002', location: { coordinates: [52.0, -1.0] } }
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
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledTimes(1)
    expect(mockMapInstance.addMarker).toHaveBeenCalledWith(
      'ms-UKA002',
      [-1.0, 52.0],
      expect.objectContaining({ viewBox: '0 0 38 38' })
    )
  })

  test('Should skip stations with null location', async () => {
    const stations = [
      { localSiteID: 'UKA001', location: null },
      { localSiteID: 'UKA002', location: { coordinates: [52.0, -1.0] } }
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
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledTimes(1)
  })

  test('Should skip stations with non-array coordinates', async () => {
    const stations = [
      { localSiteID: 'UKA001', location: { coordinates: 'invalid' } },
      { localSiteID: 'UKA002', location: { coordinates: [52.0, -1.0] } }
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
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).toHaveBeenCalledTimes(1)
  })

  test('Should not add markers when fetch returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    vi.resetModules()
    await import('./map.js')
    await Promise.resolve()
    await Promise.resolve()
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
    await Promise.resolve()
    await Promise.resolve()
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
    await Promise.resolve()
    await Promise.resolve()
    mapReadyCallback()
    expect(mockMapInstance.addMarker).not.toHaveBeenCalled()
  })
})
