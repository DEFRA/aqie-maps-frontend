import Blankie from 'blankie'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    defaultSrc: ['self'],
    fontSrc: ['self', 'data:'],
    connectSrc: ['self', 'wss', 'data:', 'https://tiles.openfreemap.org'],
    mediaSrc: ['self'],
    styleSrc: [
      'self',
      "'sha256-2PZQPqAcY6IE7H879XiZ2Hm3cBUNVB41T1m3kjNvN6E='",
      "'sha256-2xbtINjVlLJj9ZoLtUvIDOoIknefI75gHwbH8jYZ+6E='"
    ],
    scriptSrc: [
      'self',
      'blob:',
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
    ],
    workerSrc: ['self', 'blob:'],
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
