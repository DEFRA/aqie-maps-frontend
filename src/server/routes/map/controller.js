/**
 * Controller for the full-screen air quality map page.
 */
import { config } from '../../../config/config.js'

// Close enough to show the station and its neighbours.
const NEARBY_STATIONS_ZOOM = 11

function renderMap(h, nearbyStationsView) {
  return h.view('map/index', {
    pageTitle: 'Air quality map',
    dataSelectorUrl: config.get('dataSelectorFrontEnd.url'),
    nearbyStationsView
  })
}

export const mapController = {
  handler(_request, h) {
    return renderMap(h)
  }
}

/**
 * Handles the dataselector's "View map of nearby monitoring stations" link:
 * opens the map centred on the posted station, with that station selected.
 * Renders the map directly rather than redirecting, so no session is needed;
 * the client then resets the address bar to /map.
 */
export const nearbyStationsMapController = {
  handler(request, h) {
    const { lat, lng, siteId } = request.payload
    return renderMap(h, {
      center: [lng, lat],
      zoom: NEARBY_STATIONS_ZOOM,
      selectedStationId: siteId ? `ms-${siteId}` : undefined
    })
  }
}
