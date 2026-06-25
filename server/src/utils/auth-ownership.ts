import { AppError } from './app-error.js'

export function assertAuthenticatedUsername(
  requestedUsername: string,
  authenticatedUsername: string,
): void {
  const requested = requestedUsername.trim().toLowerCase()
  const authenticated = authenticatedUsername.trim().toLowerCase()

  if (requested !== authenticated) {
    throw new AppError(
      403,
      'ACCOUNT_SCOPE_FORBIDDEN',
      'You can only access data for the connected GitHub account.',
    )
  }
}
