import { api, setTokens, clearTokens } from './api'
import type { TokenResponse, User } from '@/types'

interface LoginRequest {
  email: string
  password: string
}

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login', credentials)
    setTokens(data)
    return data
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken })
    } finally {
      clearTokens()
    }
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}
