import { request } from 'undici'

import { config } from '../../../config/config.js'
import { statusCodes } from '../constants/status-codes.js'

const defaultTimeoutMs = 5000
const monitoringStationInfoTimeoutMs = 120000
const backendUrl = config.get('aqieBackEnd.url')

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

  if (statusCode < statusCodes.ok || statusCode >= statusCodes.redirectStart) {
    throw new Error(`${url} responded ${statusCode}`)
  }

  return body.json()
}

async function getMonitoringStations() {
  return get(backendUrl, '/monitoringStations')
}

async function getMonitoringStationInfo() {
  return get(
    backendUrl,
    '/monitoringStationInfo',
    monitoringStationInfoTimeoutMs
  )
}

async function getForecasts() {
  const forecastApiUrl = config.get('aqieForecastApi.url')

  if (forecastApiUrl) {
    return get(forecastApiUrl, '/forecast')
  }

  return get(backendUrl, '/forecasts')
}

async function getAurnData() {
  return get(backendUrl, '/aurnData')
}

export {
  getForecasts,
  getMonitoringStationInfo,
  getMonitoringStations,
  getAurnData
}
