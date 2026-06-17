// @vitest-environment jsdom
import { vi, beforeEach, describe, test, expect } from 'vitest'

const defaultZoom = 5.4842222
const ukCentreLng = -1.4649
const ukCentreLat = 52.5619
const openFreeMapStyleUrl = 'https://tiles.openfreemap.org/styles/liberty'

let InteractiveMap
let mockMaplibreProvider

beforeEach(async () => {
  InteractiveMap = vi.fn().mockImplementation(function () {
    return {}
  })
  mockMaplibreProvider = vi.fn().mockReturnValue('maplibreProvider')
  vi.stubGlobal('defra', {
    InteractiveMap,
    maplibreProvider: mockMaplibreProvider
  })
  vi.resetModules()
  await import('./map.js')
})

describe('#map', () => {
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
})

describe('#map', () => {
  test('Should create an InteractiveMap with the UK centre coordinates', () => {
    expect(InteractiveMap).toHaveBeenCalledWith(
      'map',
      expect.objectContaining({
        center: [-1.4649, 52.5619],
        zoom: 5.4842222
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
          url: 'https://tiles.openfreemap.org/styles/liberty'
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
})
