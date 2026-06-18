import { api } from './api'
import type { Submission, SignatureType, SubmissionStatus } from '@/types'

interface SubmissionListResponse {
  submissions: Submission[]
  total: number
}

interface SubmissionCreate {
  offer_letter_id: string
  signature_type: SignatureType
  signature_data: string
}

export const submissionService = {
  async submit(body: SubmissionCreate): Promise<Submission> {
    const { data } = await api.post<Submission>('/submissions', body)
    return data
  },

  async getMy(): Promise<Submission | null> {
    const { data } = await api.get<Submission | null>('/submissions/my')
    return data
  },

  async getAll(skip = 0, limit = 50): Promise<SubmissionListResponse> {
    const { data } = await api.get<SubmissionListResponse>('/submissions', { params: { skip, limit } })
    return data
  },

  async updateStatus(id: string, status: SubmissionStatus, notes?: string): Promise<Submission> {
    const { data } = await api.patch<Submission>(`/submissions/${id}/status`, { status, notes })
    return data
  },
}
