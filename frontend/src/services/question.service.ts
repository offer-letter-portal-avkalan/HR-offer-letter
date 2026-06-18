import { api } from './api'
import type { Question, QuestionCreate } from '@/types'

interface QuestionListResponse {
  questions: Question[]
  total: number
}

interface QuestionUpdate {
  title?: string
  description?: string
  is_required?: boolean
  is_active?: boolean
  display_order?: number
}

export const questionService = {
  async getActive(): Promise<Question[]> {
    const { data } = await api.get<Question[]>('/questions/active')
    return data
  },

  async getAll(skip = 0, limit = 50): Promise<QuestionListResponse> {
    const { data } = await api.get<QuestionListResponse>('/questions', { params: { skip, limit } })
    return data
  },

  async create(body: QuestionCreate): Promise<Question> {
    const { data } = await api.post<Question>('/questions', body)
    return data
  },

  async update(id: string, body: QuestionUpdate): Promise<Question> {
    const { data } = await api.patch<Question>(`/questions/${id}`, body)
    return data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/questions/${id}`)
  },
}
