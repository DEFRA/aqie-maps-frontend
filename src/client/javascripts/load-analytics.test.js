// @vitest-environment jsdom
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = '<script></script>'
  window.gtmLoaded = false
  window.dataLayer = undefined
  vi.resetModules()
})

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  window.gtmLoaded = false
  window.dataLayer = undefined
})

describe('#loadAnalytics', () => {
  test('Should initialise the data layer and set the loaded guard', async () => {
    const { loadAnalytics } = await import('./load-analytics.js')

    loadAnalytics()

    expect(window.gtmLoaded).toBe(true)
    expect(Array.isArray(window.dataLayer)).toBe(true)
  })

  test('Should push a granted consent default onto the data layer', async () => {
    const { loadAnalytics } = await import('./load-analytics.js')

    loadAnalytics()

    const consentEntry = window.dataLayer.find(
      (entry) => entry[0] === 'consent'
    )
    expect(Array.from(consentEntry)).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'granted',
        analytics_storage: 'granted',
        personalization_storage: 'granted',
        functionality_storage: 'granted',
        security_storage: 'granted'
      }
    ])
  })

  test('Should append the gtag.js script tag to the document head', async () => {
    const { loadAnalytics } = await import('./load-analytics.js')

    loadAnalytics()

    const script = document.head.querySelector(
      'script[src^="https://www.googletagmanager.com/gtag/js"]'
    )
    expect(script).not.toBeNull()
    expect(script.src).toContain('id=G-NX0F88HVBL')
  })

  test('Should push the gtag config and js commands onto the data layer', async () => {
    const { loadAnalytics } = await import('./load-analytics.js')

    loadAnalytics()

    expect(window.dataLayer.some((entry) => entry[0] === 'config')).toBe(true)
    expect(window.dataLayer.some((entry) => entry[0] === 'js')).toBe(true)
  })

  test('Should insert the GTM script before the first existing script tag', async () => {
    const { loadAnalytics } = await import('./load-analytics.js')

    loadAnalytics()

    const gtmScript = document.querySelector(
      'script[src^="https://www.googletagmanager.com/gtm.js"]'
    )
    expect(gtmScript).not.toBeNull()
    expect(gtmScript.src).toContain('id=GTM-MD2RN3RG')
  })

  test('Should not reinitialise analytics when already loaded', async () => {
    const { loadAnalytics } = await import('./load-analytics.js')

    loadAnalytics()
    const firstDataLayer = [...window.dataLayer]
    loadAnalytics()

    expect(window.dataLayer).toEqual(firstDataLayer)
  })
})
