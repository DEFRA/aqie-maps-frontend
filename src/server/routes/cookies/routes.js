import { cookiesController } from './controller.js'

const routes = [
  {
    method: 'GET',
    path: '/cookies',
    ...cookiesController
  }
]

export { routes }
