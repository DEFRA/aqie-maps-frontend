import { beforeEach, describe, expect, test, vi } from 'vitest'

const mockGet = vi.fn()

vi.mock('./http-client.js', () => ({
  get: mockGet
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

describe('#aqieForecastApiHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockConfigGet.mockImplementation((key) => {
      if (key === 'aqieBackEnd.url') {
        return 'http://localhost:3001'
      }

      if (key === 'aqieForecastApi.url') {
        return null
      }

      return null
    })
  })

  test('Should use forecast API when AQIE_FORECAST_API_URL is configured', async () => {
    const payload = { message: 'success', forecasts: [] }
    mockConfigGet.mockImplementation((key) => {
      if (key === 'aqieBackEnd.url') {
        return 'http://localhost:3001'
      }

      if (key === 'aqieForecastApi.url') {
        return 'http://localhost:3002'
      }

      return null
    })
    mockOkResponse(payload)

    const { getForecasts } = await import('./aqie-forecast-api.js')
    const result = await getForecasts()

    expect(mockGet).toHaveBeenCalledWith(
      'http://localhost:3002',
      '/forecast'
    )
    expect(result).toEqual(payload)
  })

  test('Should fall back to aqie-back-end forecasts endpoint when forecast API URL is missing', async () => {
    const payload = { message: 'success', forecasts: [] }
    mockOkResponse(payload)

    const { getForecasts } = await import('./aqie-forecast-api.js')
    await getForecasts()

    expect(mockGet).toHaveBeenCalledWith(
      'http://localhost:3001',
      '/forecasts'
    )
  })

  test('Should throw when upstream returns non-2xx response', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'aqieForecastApi.url') {
        return 'http://localhost:3002'
      }

      return 'http://localhost:3001'
    })
    mockGet.mockRejectedValueOnce(
      new Error('http://localhost:3002/forecast responded 500')
    )

    const { getForecasts } = await import('./aqie-forecast-api.js')

    await expect(getForecasts()).rejects.toThrow(
      'http://localhost:3002/forecast responded 500'
    )
  })
})
