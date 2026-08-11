// @ts-nocheck
// gtag must use `arguments` (not rest params) — GTM checks for an Arguments object in the dataLayer
function gtag() {
  window.dataLayer.push(arguments) // NOSONAR
}

function loadAnalytics() {
  if (!window.gtmLoaded) {
    window.gtmLoaded = true
    window.dataLayer = window.dataLayer || []
    // Only runs after the user has accepted analytics cookies
    gtag('consent', 'default', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      personalization_storage: 'granted',
      functionality_storage: 'granted',
      security_storage: 'granted'
    })
    const k = document.createElement('script')
    k.async = true
    k.src = 'https://www.googletagmanager.com/gtag/js?id=G-NX0F88HVBL'
    document.head.appendChild(k)
    gtag('js', new Date())
    gtag('config', 'G-NX0F88HVBL')
    // prettier-ignore
    ;(function (_win, doc, tagName, dataLayerName, containerId) {
      const f = doc.getElementsByTagName(tagName)[0]
      const j = doc.createElement(tagName)
      const dl = dataLayerName !== 'dataLayer' ? '&l=' + dataLayerName : ''
      j.async = true
      j.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}${dl}`
      f.parentNode.insertBefore(j, f)
    })(window, document, 'script', 'dataLayer', 'GTM-MD2RN3RG')
  }
}

export { loadAnalytics }
