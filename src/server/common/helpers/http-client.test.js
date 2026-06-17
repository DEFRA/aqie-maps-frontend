import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockRequest = vi.fn()
const mockJson = vi.fn()

vi.mock('undici', () => ({
  request: mockRequest
}))

describe('#httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should throw when base URL is missing', async () => {
    const { getJson } = await import('./http-client.js')

    await expect(getJson('', '/monitoringStations')).rejects.toThrow(
      'Missing base URL for /monitoringStations'
    )
  })

  test('Should request and return JSON payload', async () => {
    const payload = { message: 'success' }
    mockJson.mockResolvedValueOnce(payload)
    mockRequest.mockResolvedValueOnce({
      statusCode: 200,
      body: { json: mockJson }
    })

    const { getJson } = await import('./http-client.js')
    const result = await getJson('http://localhost:3001', '/monitoringStations')

    expect(mockRequest).toHaveBeenCalledWith(
      'http://localhost:3001/monitoringStations',
      {
        method: 'GET',
        headersTimeout: 5000,
        bodyTimeout: 5000
      }
    )
    expect(result).toEqual(payload)
  })

  test('Should use custom timeout value when provided', async () => {
    mockJson.mockResolvedValueOnce({})
    mockRequest.mockResolvedValueOnce({
      statusCode: 200,
      body: { json: mockJson }
    })

    const { getJson } = await import('./http-client.js')
    await getJson('http://localhost:3001', '/monitoringStationInfo', 120000)

    expect(mockRequest).toHaveBeenCalledWith(
      'http://localhost:3001/monitoringStationInfo',
      {
        method: 'GET',
        headersTimeout: 120000,
        bodyTimeout: 120000
      }
    )
  })

  test('Should throw when upstream returns no content response', async () => {
    mockRequest.mockResolvedValueOnce({
      statusCode: 204,
      body: { json: mockJson }
    })

    const { getJson } = await import('./http-client.js')
    await expect(getJson('http://localhost:3001', '/health')).rejects.toThrow(
      'http://localhost:3001/health responded 204'
    )
  })

  test('Should throw when upstream returns non-200 response', async () => {
    mockRequest.mockResolvedValueOnce({
      statusCode: 500,
      body: { json: mockJson }
    })

    const { getJson } = await import('./http-client.js')

    await expect(
      getJson('http://localhost:3001', '/monitoringStations')
    ).rejects.toThrow('http://localhost:3001/monitoringStations responded 500')
  })
})
