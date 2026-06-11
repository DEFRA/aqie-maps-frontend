import { mapController } from './controller.js'

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
        }
      ])
    }
  }
}