/**
 * Controller for the full-screen air quality map page.
 */
export const mapController = {
  handler(_request, h) {
    return h.view('map/index', {
      pageTitle: 'Air quality map'
    })
  }
}
