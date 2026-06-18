import { api } from './api'
import type { OfferLetter, OfferLetterSignedUrl } from '@/types'

interface OfferLetterListResponse {
  offer_letters: OfferLetter[]
  total: number
}

export const offerLetterService = {
  async upload(candidateId: string, file: File): Promise<OfferLetter> {
    const form = new FormData()
    form.append('candidate_id', candidateId)
    form.append('file', file)
    const { data } = await api.post<OfferLetter>('/offer-letters', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async getAll(skip = 0, limit = 50): Promise<OfferLetterListResponse> {
    const { data } = await api.get<OfferLetterListResponse>('/offer-letters', { params: { skip, limit } })
    return data
  },

  async getMy(): Promise<OfferLetter | null> {
    const { data } = await api.get<OfferLetter | null>('/offer-letters/my')
    return data
  },

  async getSignedUrl(id: string): Promise<OfferLetterSignedUrl> {
    const { data } = await api.get<OfferLetterSignedUrl>(`/offer-letters/${id}/signed-url`)
    return data
  },
}
