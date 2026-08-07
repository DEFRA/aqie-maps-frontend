import { cookiesContent } from './content.js'

const COOKIES_PATH = '/cookies'

function cookiesHandler(request, h) {
  const {
    pageTitle,
    description,
    title,
    heading,
    headings,
    table1,
    table2,
    paragraphs,
    cookieBanner
  } = cookiesContent

  return h.view('cookies/index', {
    pageTitle,
    description,
    title,
    heading,
    headings,
    table1,
    table2,
    paragraphs,
    cookieBanner,
    currentPath: COOKIES_PATH
  })
}

export const cookiesController = {
  handler: cookiesHandler
}

export { cookiesHandler }
