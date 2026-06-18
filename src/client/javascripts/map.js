/* global defra */

/**
 * Concurrent map + station loading strategy
 *
 * The map tile load and the station data fetch are kicked off at the same time
 * rather than sequentially. This means the total time to see markers on screen
 * is roughly max(map load time, fetch time) rather than the sum of both.
 *
 * Two flags coordinate whichever finishes first:
 *   - `mapReady`    — set to true when map:firstidle fires
 *   - `stationList` — set once the fetch resolves
 *
 * `plotStationMarkers` is called by whichever side completes last, so markers
 * appear as soon as both are ready regardless of order.
 */

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
 * rather than causing a map error.
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

let mapReady = false
let stationList = null

/**
 * Adds a marker to the map for every station with valid coordinates.
 * Called by whichever of map:firstidle / loadMonitoringStations completes last.
 */
function plotStationMarkers() {
  stationList.forEach((station) => {
    if (!hasValidCoords(station)) {
      return
    }
    map.addMarker(
      stationMarkerId(station),
      stationMapCoords(station),
      defaultMarkerOptions
    )
  })
}

/**
 * Fetches monitoring stations from the server-side proxy and stores the result.
 * Called without await so it runs concurrently with map tile loading — see the
 * module-level comment for the full explanation of this approach.
 * Stations are non-critical: a fetch failure logs a warning but does not
 * prevent the map from loading.
 */
async function loadMonitoringStations() {
  try {
    const response = await fetch('/api/monitoring-stations')
    if (!response.ok) {
      return
    }
    const { stations = [] } = await response.json()
    stationList = stations
    // If the map is already idle, plot immediately; otherwise map:firstidle will.
    if (mapReady) {
      plotStationMarkers()
    }
  } catch (err) {
    // stations are optional — map still loads without them
    console.warn('Failed to load monitoring stations', err)
  }
}

// When the map has finished loading its initial tiles, record that it is ready.
// If the station fetch already completed, plot markers straight away.
map.on('map:firstidle', () => {
  mapReady = true
  if (stationList) {
    plotStationMarkers()
  }
})

// Start the fetch concurrently with map tile loading — not awaited intentionally.
loadMonitoringStations()

export { map }
