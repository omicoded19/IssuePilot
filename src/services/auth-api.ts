import { API_BASE_URL, apiRequest } from './api-client'
import type { AuthStatus, AuthUser } from '@/types/auth'

interface ApiEnvelope<T> {
  success: true
  data: T
}

export function getGitHubLoginUrl(): string {
  return `${API_BASE_URL}/api/auth/github/start`
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const response = await apiRequest<ApiEnvelope<AuthStatus>>('/api/auth/status')
  return response.data
}

export async function getCurrentAuthUser(): Promise<AuthUser> {
  const response = await apiRequest<ApiEnvelope<AuthUser>>('/api/auth/me')
  return response.data
}

export async function logoutAuthUser(): Promise<void> {
  await apiRequest<ApiEnvelope<{ loggedOut: boolean }>>('/api/auth/logout', {
    method: 'POST',
  })
}

export interface DeleteAccountResult {
  deleted: boolean
  githubAuthorizationRevoked: boolean
}

export async function exportAuthUserData(): Promise<unknown> {
  const response = await apiRequest<ApiEnvelope<unknown>>('/api/auth/data-export')
  return response.data
}

export async function deleteAuthAccount(): Promise<DeleteAccountResult> {
  const response = await apiRequest<ApiEnvelope<DeleteAccountResult>>('/api/auth/account', {
    method: 'DELETE',
  })
  return response.data
}
