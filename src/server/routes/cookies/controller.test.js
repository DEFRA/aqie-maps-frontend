import { vi } from 'vitest'
import { cookiesController, cookiesHandler } from './controller.js'
import { cookiesContent } from './content.js'

const VIEW_RENDERED = 'view rendered'
const COOKIES_PATH = '/cookies'
const COOKIES_INDEX = 'cookies/index'

const createMockRequest = () => ({
  query: {},
  path: COOKIES_PATH
})

const createMockH = () => ({
  view: vi.fn().mockReturnValue(VIEW_RENDERED)
})

describe('Cookies Handler', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockH = createMockH()
  })

  it('should render the cookies page with content data', () => {
    const result = cookiesController.handler(mockRequest, mockH)

    expect(result).toBe(VIEW_RENDERED)
    expect(mockH.view).toHaveBeenCalledWith(COOKIES_INDEX, {
      pageTitle: cookiesContent.pageTitle,
      description: cookiesContent.description,
      title: cookiesContent.title,
      heading: cookiesContent.heading,
      headings: cookiesContent.headings,
      table1: cookiesContent.table1,
      table2: cookiesContent.table2,
      paragraphs: cookiesContent.paragraphs,
      cookieBanner: cookiesContent.cookieBanner,
      currentPath: COOKIES_PATH
    })
  })

  it('should export a handler via cookiesHandler', () => {
    const result = cookiesHandler(mockRequest, mockH)

    expect(result).toBe(VIEW_RENDERED)
    expect(mockH.view).toHaveBeenCalledWith(COOKIES_INDEX, expect.any(Object))
  })
})
