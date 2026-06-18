import { api } from './api'
import type { User } from '@/types'

interface UserCreate {
  email: string
  password: string
  full_name: string
  role: 'hr_admin' | 'candidate'
}

interface UserListResponse {
  users: User[]
  total: number
}

export const userService = {
  async create(body: UserCreate): Promise<User> {
    const { data } = await api.post<User>('/users', body)
    return data
  },

  async getAll(skip = 0, limit = 50): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>('/users', { params: { skip, limit } })
    return data
  },

  async getCandidates(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users/candidates')
    return data
  },

  async update(id: string, body: { full_name?: string; is_active?: boolean }): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, body)
    return data
  },
}
