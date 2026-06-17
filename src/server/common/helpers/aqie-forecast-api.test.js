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

    expect(mockRequest).toHaveBeenCalledWith(
      'http://localhost:3002/forecast',
      expect.objectContaining({ method: 'GET' })
    )
    expect(result).toEqual(payload)
  })

  test('Should fall back to aqie-back-end forecasts endpoint when forecast API URL is missing', async () => {
    const payload = { message: 'success', forecasts: [] }
    mockOkResponse(payload)

    const { getForecasts } = await import('./aqie-forecast-api.js')
    await getForecasts()

    expect(mockRequest).toHaveBeenCalledWith(
      'http://localhost:3001/forecasts',
      expect.objectContaining({ method: 'GET' })
    )
  })

  test('Should throw when upstream returns non-2xx response', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'aqieForecastApi.url') {
        return 'http://localhost:3002'
      }

      return 'http://localhost:3001'
    })
    mockRequest.mockResolvedValueOnce({
      statusCode: 500,
      body: {
        json: mockJson
      }
    })

    const { getForecasts } = await import('./aqie-forecast-api.js')

    await expect(getForecasts()).rejects.toThrow(
      'http://localhost:3002/forecast responded 500'
    )
  })
})
