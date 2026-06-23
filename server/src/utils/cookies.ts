import type { Request } from 'express'

export function parseCookies(request: Request): Record<string, string> {
  const header = request.headers.cookie
  if (!header) return {}

  return header.split(';').reduce<Record<string, string>>((cookies, segment) => {
    const separatorIndex = segment.indexOf('=')
    if (separatorIndex < 0) return cookies

    const key = segment.slice(0, separatorIndex).trim()
    const rawValue = segment.slice(separatorIndex + 1).trim()
    if (!key) return cookies

    try {
      cookies[key] = decodeURIComponent(rawValue)
    } catch {
      cookies[key] = rawValue
    }
    return cookies
  }, {})
}
