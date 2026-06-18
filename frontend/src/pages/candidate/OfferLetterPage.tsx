import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FileText, CheckCircle, ExternalLink } from 'lucide-react'
import { offerLetterService } from '@/services/offer_letter.service'
import { answerService } from '@/services/answer.service'
import { submissionService } from '@/services/submission.service'
import { questionService } from '@/services/question.service'
import { Button } from '@/components/ui/Button'
import { SignaturePad } from '@/components/ui/SignatureCanvas'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useContentProtection } from '@/hooks/useContentProtection'
import type { SubmissionStatus } from '@/types'

const statusVariant: Record<SubmissionStatus, 'blue' | 'green' | 'red' | 'gray'> = {
  pending: 'gray', submitted: 'blue', accepted: 'green', rejected: 'red',
}

export function CandidateOfferLetterPage() {
  const qc = useQueryClient()
  useContentProtection(true)
  const [signature, setSignature] = useState<string | null>(null)
  const [signedUrlData, setSignedUrlData] = useState<{ url: string; fetching: boolean }>({ url: '', fetching: false })

  const { data: offerLetter, isLoading: olLoading } = useQuery({
    queryKey: ['my-offer-letter'],
    queryFn: offerLetterService.getMy,
  })

  const { data: submission, isLoading: subLoading } = useQuery({
    queryKey: ['my-submission'],
    queryFn: submissionService.getMy,
  })

  const { data: questions } = useQuery({ queryKey: ['active-questions'], queryFn: questionService.getActive })
  const { data: answers } = useQuery({ queryKey: ['my-answers'], queryFn: answerService.getMyAnswers })

  const requiredCount = questions?.filter((q) => q.is_required).length ?? 0
  const answeredCount = answers?.answers.filter((a) => !a.is_draft).length ?? 0
  const allAnswered = answeredCount >= requiredCount

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!offerLetter || !signature) throw new Error('Missing data')
      const isTyped = signature.startsWith('TYPED:')
      return submissionService.submit({
        offer_letter_id: offerLetter.id,
        signature_type: isTyped ? 'typed' : 'drawn',
        signature_data: signature,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-submission'] })
      toast.success('Offer letter submitted successfully!')
    },
    onError: (e: Error) => toast.error(e.message || 'Submission failed'),
  })

  const handleViewPDF = async () => {
    if (!offerLetter) return
    setSignedUrlData({ url: '', fetching: true })
    try {
      const { signed_url } = await offerLetterService.getSignedUrl(offerLetter.id)
      setSignedUrlData({ url: signed_url, fetching: false })
      if (window.electronAPI?.isElectron) {
        // In Electron: load in the same window so setContentProtection still applies
        window.location.href = signed_url
      } else {
        // Fallback for browser — opens new tab (no OS-level protection)
        window.open(signed_url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      toast.error('Failed to get download link')
      setSignedUrlData({ url: '', fetching: false })
    }
  }

  if (olLoading || subLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offer Letter</h1>
        <p className="text-gray-500 text-sm mt-1">Review, sign, and submit your offer letter</p>
      </div>

      {!offerLetter ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <FileText size={32} className="text-yellow-500 mx-auto mb-2" />
          <p className="text-yellow-800 font-medium">No offer letter available yet</p>
          <p className="text-yellow-600 text-sm mt-1">Your HR team will upload it soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{offerLetter.original_filename}</p>
                  <p className="text-xs text-gray-400">Uploaded {new Date(offerLetter.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleViewPDF}
                loading={signedUrlData.fetching}
              >
                <ExternalLink size={14} /> View PDF
              </Button>
            </div>
          </div>

          {submission ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={20} className="text-green-500" />
                <h2 className="font-semibold text-gray-900">Submission Status</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge label={submission.status} variant={statusVariant[submission.status]} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted</span>
                  <span className="text-gray-700">{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '—'}</span>
                </div>
                {submission.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Note</span>
                    <span className="text-gray-700">{submission.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Sign &amp; Submit</h2>

              {!allAnswered && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  You must answer all {requiredCount} required questions before submitting.
                  Currently {answeredCount}/{requiredCount} answered.
                </div>
              )}

              <SignaturePad onChange={setSignature} />

              <Button
                className="w-full"
                size="lg"
                disabled={!signature || !allAnswered}
                loading={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                Submit Offer Letter
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
