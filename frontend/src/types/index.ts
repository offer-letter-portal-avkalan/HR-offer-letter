export type UserRole = 'hr_admin' | 'candidate'

export type QuestionType = 'text' | 'multiple_choice' | 'yes_no' | 'rating'

export type SubmissionStatus = 'pending' | 'submitted' | 'accepted' | 'rejected'

export type SignatureType = 'drawn' | 'typed'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface Question {
  id: string
  title: string
  description: string | null
  question_type: QuestionType
  options: string[] | null
  is_required: boolean
  is_active: boolean
  display_order: number
  created_at: string
}

export interface QuestionCreate {
  title: string
  description?: string
  question_type: QuestionType
  options?: string[]
  is_required: boolean
  display_order: number
}

export interface OfferLetter {
  id: string
  candidate_id: string
  original_filename: string
  is_active: boolean
  created_at: string
}

export interface OfferLetterSignedUrl {
  signed_url: string
  expires_in: number
}

export interface Answer {
  id: string
  question_id: string
  response_text: string | null
  response_json: unknown | null
  is_draft: boolean
  updated_at: string
}

export interface AnswerUpsert {
  question_id: string
  response_text?: string
  response_json?: unknown
  is_draft: boolean
}

export interface Submission {
  id: string
  candidate_id: string
  offer_letter_id: string
  signature_type: SignatureType
  signature_data: string
  status: SubmissionStatus
  submitted_at: string | null
  notes: string | null
  created_at: string
}

export interface ApiError {
  detail: string
  errors?: { field: string; message: string }[]
}
