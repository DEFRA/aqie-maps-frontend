import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockGet = vi.fn()

vi.mock('./http-client.js', () => ({
  getJson: mockGet
}))

const mockConfigGet = vi.fn()

vi.mock('../../../config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

function mockOkResponse(payload) {
  mockGet.mockResolvedValueOnce(payload)
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

    expect(mockGet).toHaveBeenCalledWith(
      'http://localhost:3001',
      '/monitoringStations'
    )
    expect(result).toEqual(payload)
  })

  test('Should fetch monitoring station info with long timeout', async () => {
    const payload = { message: 'success', monitoringStationInfo: [] }
    mockOkResponse(payload)

    const { getMonitoringStationInfo } = await import('./aqie-back-end.js')
    await getMonitoringStationInfo()

    expect(mockGet).toHaveBeenCalledWith(
      'http://localhost:3001',
      '/monitoringStationInfo',
      120000
    )
  })

  test('Should throw when upstream returns non-2xx response', async () => {
    mockGet.mockRejectedValueOnce(
      new Error('http://localhost:3001/monitoringStations responded 500')
    )

    const { getMonitoringStations } = await import('./aqie-back-end.js')

    await expect(getMonitoringStations()).rejects.toThrow(
      'http://localhost:3001/monitoringStations responded 500'
    )
  })
})
