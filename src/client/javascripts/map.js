/* global defra */

const defaultZoom = 5.4842222
const ukCentreLng = -1.4649
const ukCentreLat = 52.5619

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
  return [parseFloat(coords[1]), parseFloat(coords[0])]
}

/**
 * Returns true only when a station has a plottable coordinate pair.
 * Stations missing location data or with non-finite values are skipped
 * @param {{ location?: { coordinates?: unknown } }} station
 * @returns {boolean}
 */
function hasValidCoords(station) {
  const coords = station.location?.coordinates
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false
  }
  if (!isFinite(coords[0]) || !isFinite(coords[1])) {
    return false
  }
  return true
}

const defaultMarkerOptions = {
  symbolSvgContent:
    '<defs><filter id="ds" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>' +
    '</filter></defs>' +
    '<circle cx="19" cy="19" r="14" fill="#777777" stroke="white" stroke-width="2" filter="url(#ds)"/>',
  viewBox: '0 0 38 38',
  anchor: [0.5, 0.5]
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

// Monitoring stations displayed on map once map loaded.
map.on('map:firstidle', () => {
  stations.forEach((station) => {
    if (!hasValidCoords(station)) {
      return
    }
    map.addMarker(
      stationMarkerId(station),
      stationMapCoords(station),
      defaultMarkerOptions
    )
  })
})

export { map }
