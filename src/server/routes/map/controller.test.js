import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#mapController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return 200 for GET /map', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/map'
    })

    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should render the correct page title', async () => {
    const { result } = await server.inject({
      method: 'GET',
      url: '/map'
    })

    expect(result).toEqual(expect.stringContaining('Air quality map |'))
  })

  test('Should render the map container element', async () => {
    const { result } = await server.inject({
      method: 'GET',
      url: '/map'
    })

    expect(result).toEqual(expect.stringContaining('app-map-container'))
    expect(result).toEqual(expect.stringContaining('id="map"'))
  })
})
