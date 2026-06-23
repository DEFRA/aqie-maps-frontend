import { statusCodes } from '../../../common/constants/status-codes.js'
import {
  getMonitoringStationInfo,
  getMonitoringStations
} from '../../../common/helpers/aqie-back-end.js'

function upstreamErrorResponse(h) {
  return h
    .response({ message: 'Failed to fetch data from upstream API' })
    .code(statusCodes.internalServerError)
}

const monitoringStationsController = {
  async handler(request, h) {
    try {
      const result = await getMonitoringStations()
      return h.response(result).code(statusCodes.ok)
    } catch (error) {
      request.logger.error(error)
      return upstreamErrorResponse(h)
    }
  }
}

const monitoringStationInfoController = {
  async handler(request, h) {
    try {
      const result = await getMonitoringStationInfo()
      return h.response(result).code(statusCodes.ok)
    } catch (error) {
      request.logger.error(error)
      return upstreamErrorResponse(h)
    }
  }
}

export { monitoringStationInfoController, monitoringStationsController }
