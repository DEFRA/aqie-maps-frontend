import { routes } from './routes.js'

const cookies = {
  plugin: {
    name: 'cookies',
    register: async (server) => {
      server.route(routes)
    }
  }
}

export { cookies }
