import { request } from 'undici'
import { statusCodes } from '../constants/status-codes.js'

const defaultTimeoutMs = 5000

function buildUrl(baseUrl, path) {
  return new URL(path, baseUrl).toString()
}

async function getJson(baseUrl, path, timeoutMs = defaultTimeoutMs) {
  if (!baseUrl) {
    throw new Error(`Missing base URL for ${path}`)
  }

  const url = buildUrl(baseUrl, path)
  const { statusCode, body } = await request(url, {
    method: 'GET',
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs
  })

  if (statusCode !== statusCodes.ok) {
    throw new Error(`${url} responded ${statusCode}`)
  }

  return body.json()
}

export { getJson }
