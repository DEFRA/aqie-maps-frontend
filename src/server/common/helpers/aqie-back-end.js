import { get } from './http-client.js'

import { config } from '../../../config/config.js'

const monitoringStationInfoTimeoutMs = 120000

async function getMonitoringStations() {
  return get(config.get('aqieBackEnd.url'), '/monitoringStations')
}

async function getMonitoringStationInfo() {
  return get(
    config.get('aqieBackEnd.url'),
    '/monitoringStationInfo',
    monitoringStationInfoTimeoutMs
  )
}

export { getMonitoringStationInfo, getMonitoringStations }
