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

describe('#mapController dataSelectorUrl', () => {
  afterEach(() => {
    vi.doUnmock('../../../config/config.js')
    vi.resetModules()
  })

  test('Should pass the configured dataSelectorUrl to the view', async () => {
    vi.resetModules()
    vi.doMock('../../../config/config.js', () => ({
      config: {
        get: () => 'https://aqie-dataselector-frontend.example'
      }
    }))
    const { mapController } = await import('./controller.js')
    const h = { view: vi.fn() }

    mapController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith('map/index', {
      pageTitle: 'Air quality map',
      dataSelectorUrl: 'https://aqie-dataselector-frontend.example'
    })
  })

  test('Should pass a null dataSelectorUrl to the view when not configured', async () => {
    vi.resetModules()
    vi.doMock('../../../config/config.js', () => ({
      config: { get: () => null }
    }))
    const { mapController } = await import('./controller.js')
    const h = { view: vi.fn() }

    mapController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith('map/index', {
      pageTitle: 'Air quality map',
      dataSelectorUrl: null
    })
  })
})
