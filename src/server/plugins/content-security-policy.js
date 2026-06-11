import Blankie from 'blankie'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    // Hash 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=' is to support a GOV.UK frontend script bundled within Nunjucks macros
    // https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy
    defaultSrc: ['self'],
    fontSrc: ['self', 'data:'],
    // wss — WebSocket for Vite HMR in dev. tiles.openfreemap.org — MapLibre tile/style requests.
    connectSrc: ['self', 'wss', 'data:', 'https://tiles.openfreemap.org'],
    mediaSrc: ['self'],
    styleSrc: ['self'],
    scriptSrc: [
      'self',
      // MapLibre GL requires blob: for its web worker
      "'blob:'",
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
    ],
    // MapLibre GL spawns a web worker from a blob: URL — without this the map silently fails to render
    workerSrc: ['self', "'blob:'"],
    // Map tile images are loaded from OpenFreeMap
    imgSrc: ['self', 'data:', 'https://tiles.openfreemap.org'],
    frameSrc: ['self', 'data:'],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self'],
    manifestSrc: ['self'],
    generateNonces: false
  }
}

export { contentSecurityPolicy }
