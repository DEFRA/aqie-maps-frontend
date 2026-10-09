/**
 * Controller for the full-screen air quality map page.
 */
import { config } from '../../../config/config.js'

export const mapController = {
  handler(_request, h) {
    return h.view('map/index', {
      pageTitle: 'Air quality map',
      dataSelectorUrl: config.get('dataSelectorFrontEnd.url')
    })
  }
}
