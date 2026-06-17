import { forecastsController } from './controller.js'

const forecastsApi = {
  plugin: {
    name: 'forecastsApi',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/api/forecasts',
          ...forecastsController
        }
      ])
    }
  }
}

export { forecastsApi }
