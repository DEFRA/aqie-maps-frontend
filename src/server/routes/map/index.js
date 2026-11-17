import { mapController, nearbyStationsMapController } from './controller.js'
import { nearbyStationsPayloadSchema } from './schema.js'

// The payload is a few short fields, so cap it well below hapi's 1MB default.
const MAX_PAYLOAD_BYTES = 1024

/**
 * Sets up the routes used in the map page.
 * These routes are registered in src/server/plugins/router.js.
 */
export const map = {
  plugin: {
    name: 'map',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/map',
          ...mapController
        },
        {
          method: 'POST',
          path: '/map/view',
          options: {
            payload: { maxBytes: MAX_PAYLOAD_BYTES },
            validate: {
              payload: nearbyStationsPayloadSchema,
              // Bad input still gets a working map, just at the default view
              failAction: (_request, h) => h.redirect('/map').takeover()
            }
          },
          ...nearbyStationsMapController
        }
      ])
    }
  }
}
