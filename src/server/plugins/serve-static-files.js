import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { config } from '../../config/config.js'
import { statusCodes } from '../common/constants/status-codes.js'

const dir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(dir, '../../..')

export const serveStaticFiles = {
  plugin: {
    name: 'staticFiles',
    register(server) {
      server.route([
        {
          options: {
            auth: false,
            cache: {
              expiresIn: config.get('staticCacheTimeout'),
              privacy: 'private'
            }
          },
          method: 'GET',
          path: '/favicon.ico',
          handler(_request, h) {
            return h.response().code(statusCodes.noContent).type('image/x-icon')
          }
        },
        {
          options: {
            auth: false,
            cache: {
              expiresIn: config.get('staticCacheTimeout'),
              privacy: 'private'
            }
          },
          method: 'GET',
          path: `${config.get('assetPath')}/{param*}`,
          handler: {
            directory: {
              path: '.',
              redirectToSlash: true
            }
          }
        }
      ])
    }
  }
}

export const serveMapAssets = {
  plugin: {
    name: 'mapAssets',
    register(server) {
      server.route([
        {
          options: {
            auth: false,
            cache: {
              expiresIn: config.get('staticCacheTimeout'),
              privacy: 'private'
            }
          },
          method: 'GET',
          path: '/map-assets/{param*}',
          handler: {
            directory: {
              path: resolve(projectRoot, 'node_modules/@defra/interactive-map'),
              redirectToSlash: true
            }
          }
        }
      ])
    }
  }
}
