import { get } from './http-client.js'

import { config } from '../../../config/config.js'

async function getForecasts() {
  const forecastApiUrl = config.get('aqieForecastApi.url')

  if (forecastApiUrl) {
    return get(forecastApiUrl, '/forecast')
  }

  return get(config.get('aqieBackEnd.url'), '/forecasts')
}

export { getForecasts }
