import { getJson } from './http-client.js'

import { config } from '../../../config/config.js'

const monitoringStationInfoTimeoutMs = 120000

async function getMonitoringStations() {
  return getJson(config.get('aqieBackEnd.url'), '/monitoringStations')
}

async function getMonitoringStationInfo() {
  return getJson(
    config.get('aqieBackEnd.url'),
    '/monitoringStationInfo',
    monitoringStationInfoTimeoutMs
  )
}

export { getMonitoringStationInfo, getMonitoringStations }
