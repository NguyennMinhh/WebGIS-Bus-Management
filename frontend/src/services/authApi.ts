import { apiRequest } from './api'
import type { AuthUser, LoginInput, RegisterInput } from '../types'

const jsonRequest = <T>(path: string, payload?: unknown) =>
  apiRequest<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })

export const getCurrentUser = () => apiRequest<AuthUser>('/auth/me/')

export const login = (payload: LoginInput) =>
  jsonRequest<AuthUser>('/auth/login/', payload)

export const register = (payload: RegisterInput) =>
  jsonRequest<AuthUser>('/auth/register/', payload)

export const logout = () => jsonRequest<AuthUser>('/auth/logout/')
