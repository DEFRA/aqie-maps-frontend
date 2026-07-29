import { statusCodes } from '../../../common/constants/status-codes.js'
import { getAurnData } from '../../../common/helpers/aqie-back-end.js'

function upstreamErrorResponse(h) {
  return h
    .response({ message: 'Failed to fetch AURN data from Aqie Back End' })
    .code(statusCodes.internalServerError)
}

const aurnDataController = {
  async handler(request, h) {
    try {
      const aurnData = await getAurnData()
      return h.response(aurnData).code(statusCodes.ok)
    } catch (error) {
      request.logger.error(error)
      return upstreamErrorResponse(h)
    }
  }
}

export { aurnDataController }
