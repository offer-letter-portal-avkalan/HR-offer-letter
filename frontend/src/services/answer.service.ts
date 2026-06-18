import { api } from './api'
import type { Answer, AnswerUpsert } from '@/types'

interface AnswerListResponse {
  answers: Answer[]
}

export const answerService = {
  async getMyAnswers(): Promise<AnswerListResponse> {
    const { data } = await api.get<AnswerListResponse>('/answers')
    return data
  },

  async upsert(body: AnswerUpsert): Promise<Answer> {
    const { data } = await api.put<Answer>('/answers', body)
    return data
  },

  async bulkUpsert(answers: AnswerUpsert[]): Promise<AnswerListResponse> {
    const { data } = await api.put<AnswerListResponse>('/answers/bulk', { answers })
    return data
  },

  async getCandidateAnswers(candidateId: string): Promise<AnswerListResponse> {
    const { data } = await api.get<AnswerListResponse>(`/answers/candidate/${candidateId}`)
    return data
  },
}
