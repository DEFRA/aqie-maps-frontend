import { getJson } from './http-client.js'

import { config } from '../../../config/config.js'

async function getForecasts() {
  const forecastApiUrl = config.get('aqieForecastApi.url')

  if (forecastApiUrl) {
    return getJson(forecastApiUrl, '/forecast')
  }

  return getJson(config.get('aqieBackEnd.url'), '/forecasts')
}

export { getForecasts }
