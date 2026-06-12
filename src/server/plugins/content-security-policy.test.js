import { createServer } from '../server.js'

describe('#contentSecurityPolicy', () => {
  let server
  let cspHeader

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()

    const resp = await server.inject({
      method: 'GET',
      url: '/'
    })
    cspHeader = resp.headers['content-security-policy']
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should set the CSP policy header', () => {
    expect(cspHeader).toBeDefined()
  })

  test('Should allow blob: in script-src for MapLibre web worker', () => {
    expect(cspHeader).toContain('script-src')
    expect(cspHeader).toContain('blob:')
  })

  test('Should allow blob: in worker-src for MapLibre web worker', () => {
    expect(cspHeader).toContain('worker-src')
    expect(cspHeader).toMatch(/worker-src[^;]*blob:/)
  })

  test('Should allow OpenFreeMap tiles in connect-src', () => {
    expect(cspHeader).toMatch(
      /connect-src[^;]*https:\/\/tiles\.openfreemap\.org/
    )
  })

  test('Should allow OpenFreeMap tile images in img-src', () => {
    expect(cspHeader).toMatch(/img-src[^;]*https:\/\/tiles\.openfreemap\.org/)
  })
})
