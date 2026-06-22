const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'
).replace(/\/$/, '')

interface ApiErrorPayload {
  success: false
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  } catch {
    throw new ApiClientError(
      'Could not reach the IssuePilot backend. Make sure the server is running.',
      0,
      'BACKEND_UNAVAILABLE',
    )
  }

  const payload = (await response.json().catch(() => null)) as
    | T
    | ApiErrorPayload
    | null

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null
    throw new ApiClientError(
      errorPayload?.error?.message ?? 'The request could not be completed.',
      response.status,
      errorPayload?.error?.code ?? 'REQUEST_FAILED',
      errorPayload?.error?.details,
    )
  }

  return payload as T
}
