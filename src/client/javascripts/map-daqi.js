// DAQI background colours indexed by DAQI value (1–10); index 0 is unused.
// Yellow (#ffdd00) values 4–6 need dark text.
const daqiBg = [
  null,
  '#00703c',
  '#00703c',
  '#00703c',
  '#ffdd00',
  '#ffdd00',
  '#ffdd00',
  '#d4351c',
  '#d4351c',
  '#d4351c',
  '#0b0c0c'
]

const daqiBand = [
  null,
  'Low',
  'Low',
  'Low',
  'Moderate',
  'Moderate',
  'Moderate',
  'High',
  'High',
  'High',
  'Very High'
]

/**
 * Builds SVG marker options coloured by DAQI value.
 * Falls back to grey when no DAQI value is available.
 * @param {number|null} daqiValue - DAQI index 1–10, or null
 * @param {boolean} selected
 * @returns {{ symbolSvgContent: string, viewBox: string, anchor: [number, number] }}
 */
function daqiMarkerOptions(daqiValue, selected) {
  let bg
  if (daqiValue && daqiBg[daqiValue]) {
    bg = daqiBg[daqiValue]
  } else if (selected) {
    bg = '#555555'
  } else {
    bg = '#777777'
  }
  const strokeAttr = selected
    ? 'stroke="#0b0c0c" stroke-width="2"'
    : 'stroke="white" stroke-width="2"'
  const textFill = bg === '#ffdd00' ? '#0b0c0c' : '#ffffff'
  const label = daqiValue
    ? `<text x="19" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="bold" fill="${textFill}">${daqiValue}</text>`
    : ''
  const shadow =
    '<defs><filter id="ds" x="-50%" y="-50%" width="200%" height="200%">' +
    '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>' +
    '</filter></defs>'
  return {
    symbolSvgContent: `${shadow}<circle cx="19" cy="19" r="14" fill="${bg}" ${strokeAttr} filter="url(#ds)"/>${label}`,
    viewBox: '0 0 38 38',
    anchor: [0.5, 0.5]
  }
}

export { daqiBand, daqiMarkerOptions }
