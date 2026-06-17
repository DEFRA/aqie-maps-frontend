import { request } from 'undici'

import { config } from '../../../config/config.js'

const defaultTimeoutMs = 5000

function buildUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString()
}

async function get(baseUrl, path, timeoutMs = defaultTimeoutMs) {
  if (!baseUrl) {
    throw new Error(`Missing base URL for ${path}`)
  }

  const url = buildUrl(baseUrl, path)
  const { statusCode, body } = await request(url, {
    method: 'GET',
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs
  })

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`${url} responded ${statusCode}`)
  }

  return body.json()
}

async function getForecasts() {
  const forecastApiUrl = config.get('aqieForecastApi.url')

  if (forecastApiUrl) {
    return get(forecastApiUrl, '/forecast')
  }

  return get(config.get('aqieBackEnd.url'), '/forecasts')
}

export { getForecasts }
