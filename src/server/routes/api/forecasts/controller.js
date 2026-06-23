import { statusCodes } from '../../../common/constants/status-codes.js'
import { getForecasts } from '../../../common/helpers/aqie-forecast-api.js'

function upstreamErrorResponse(h) {
  return h
    .response({ message: 'Failed to fetch data from upstream API' })
    .code(statusCodes.internalServerError)
}

const forecastsController = {
  async handler(request, h) {
    try {
      const result = await getForecasts()
      return h.response(result).code(statusCodes.ok)
    } catch (error) {
      request.logger.error(error)
      return upstreamErrorResponse(h)
    }
  }
}

export { forecastsController }
