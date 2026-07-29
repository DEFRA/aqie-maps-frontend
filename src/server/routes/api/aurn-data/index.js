import { aurnDataController } from './controller.js'

const aurnData = {
  plugin: {
    name: 'aurnData',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/api/aurn-data',
          ...aurnDataController
        }
      ])
    }
  }
}

export { aurnData }
