// @ts-nocheck
function loadAnalytics() {
  if (!window.gtmLoaded) {
    window.gtmLoaded = true
    window.dataLayer = window.dataLayer || []
    function gtag() {
      window.dataLayer.push(arguments)
    }
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
    ;(function (w, d, s, l, i) {
      const f = d.getElementsByTagName(s)[0]
      const j = d.createElement(s)
      const dl = l !== 'dataLayer' ? '&l=' + l : ''
      j.async = true
      j.src = `https://www.googletagmanager.com/gtm.js?id=${i}${dl}`
      f.parentNode.insertBefore(j, f)
    })(window, document, 'script', 'dataLayer', 'GTM-MD2RN3RG')
  }
}

export { loadAnalytics }
