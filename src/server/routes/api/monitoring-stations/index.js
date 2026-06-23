import {
  monitoringStationInfoController,
  monitoringStationsController
} from './controller.js'

const monitoringStationsApi = {
  plugin: {
    name: 'monitoringStationsApi',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/api/monitoring-stations',
          ...monitoringStationsController
        },
        {
          method: 'GET',
          path: '/api/monitoring-station-info',
          ...monitoringStationInfoController
        }
      ])
    }
  }
}

export { monitoringStationsApi }
