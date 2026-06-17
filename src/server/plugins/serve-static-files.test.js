import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#serveStaticFiles', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should serve favicon as expected', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/favicon.ico'
    })

    expect(statusCode).toBe(statusCodes.noContent)
  })
})

describe('#serveMapAssets', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should serve the interactive map UMD bundle', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/map-assets/dist/umd/index.js'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(headers['content-type']).toContain('javascript')
  })

  test('Should serve the maplibre provider UMD bundle', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/map-assets/providers/maplibre/dist/umd/index.js'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(headers['content-type']).toContain('javascript')
  })

  test('Should serve the interactive map CSS', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/map-assets/dist/css/index.css'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(headers['content-type']).toContain('css')
  })
})
