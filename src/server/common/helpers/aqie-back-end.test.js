import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockRequest = vi.fn()

vi.mock('undici', () => ({
  request: mockRequest
}))

const mockConfigGet = vi.fn()

vi.mock('../../../config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

const mockJson = vi.fn()

function mockOkResponse(payload) {
  mockJson.mockResolvedValueOnce(payload)
  mockRequest.mockResolvedValueOnce({
    statusCode: 200,
    body: {
      json: mockJson
    }
  })
}

describe('#aqieBackEndHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockConfigGet.mockImplementation((key) => {
      if (key === 'aqieBackEnd.url') {
        return 'http://localhost:3001'
      }

      return null
    })
  })

  test('Should fetch monitoring stations from aqie-back-end', async () => {
    const payload = { message: 'success', monitoringStations: [] }
    mockOkResponse(payload)

    const { getMonitoringStations } = await import('./aqie-back-end.js')
    const result = await getMonitoringStations()

    expect(mockRequest).toHaveBeenCalledWith(
      'http://localhost:3001/monitoringStations',
      expect.objectContaining({ method: 'GET' })
    )
    expect(result).toEqual(payload)
  })

  test('Should fetch monitoring station info with long timeout', async () => {
    const payload = { message: 'success', monitoringStationInfo: [] }
    mockOkResponse(payload)

    const { getMonitoringStationInfo } = await import('./aqie-back-end.js')
    await getMonitoringStationInfo()

    expect(mockRequest).toHaveBeenCalledWith(
      'http://localhost:3001/monitoringStationInfo',
      expect.objectContaining({
        method: 'GET',
        headersTimeout: 120000,
        bodyTimeout: 120000
      })
    )
  })

  test('Should throw when upstream returns non-2xx response', async () => {
    mockRequest.mockResolvedValueOnce({
      statusCode: 500,
      body: {
        json: mockJson
      }
    })

    const { getMonitoringStations } = await import('./aqie-back-end.js')

    await expect(getMonitoringStations()).rejects.toThrow(
      'http://localhost:3001/monitoringStations responded 500'
    )
  })
})
