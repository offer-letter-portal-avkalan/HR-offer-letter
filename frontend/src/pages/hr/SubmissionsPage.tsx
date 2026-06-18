import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { submissionService } from '@/services/submission.service'
import { answerService } from '@/services/answer.service'
import { userService } from '@/services/user.service'
import { questionService } from '@/services/question.service'
import { offerLetterService } from '@/services/offer_letter.service'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { Submission, SubmissionStatus, Question, User } from '@/types'

const statusVariant: Record<SubmissionStatus, 'blue' | 'green' | 'red' | 'gray'> = {
  pending: 'gray',
  submitted: 'blue',
  accepted: 'green',
  rejected: 'red',
}

function ReviewModal({
  submission,
  onClose,
  onUpdate,
  isUpdating,
}: {
  submission: Submission
  onClose: () => void
  onUpdate: (status: SubmissionStatus, notes: string) => void
  isUpdating: boolean
}) {
  const [notes, setNotes] = useState(submission.notes ?? '')

  const { data: candidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => userService.getCandidates(),
  })

  const { data: answersData, isLoading: answersLoading } = useQuery({
    queryKey: ['candidate-answers', submission.candidate_id],
    queryFn: () => answerService.getCandidateAnswers(submission.candidate_id),
  })

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions-active'],
    queryFn: () => questionService.getActive(),
  })

  const { data: signedUrlData, isLoading: urlLoading } = useQuery({
    queryKey: ['signed-url', submission.offer_letter_id],
    queryFn: () => offerLetterService.getSignedUrl(submission.offer_letter_id),
  })

  const candidate = candidates?.find((c: User) => c.id === submission.candidate_id)
  const questions: Question[] = questionsData ?? []
  const answers = answersData?.answers ?? []

  const getAnswer = (questionId: string) =>
    answers.find((a) => a.question_id === questionId)

  const isLoading = answersLoading || questionsLoading

  return (
    <Modal open onClose={onClose} title="Review Submission">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">

        {/* Candidate Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Candidate</p>
          {candidate ? (
            <div>
              <p className="font-semibold text-gray-900">{candidate.full_name}</p>
              <p className="text-sm text-gray-500">{candidate.email}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 font-mono">{submission.candidate_id}</p>
          )}
        </div>

        {/* Offer Letter */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-0.5">Offer Letter</p>
            <p className="text-sm text-blue-700 font-medium">View the watermarked PDF</p>
          </div>
          {urlLoading ? (
            <Spinner />
          ) : signedUrlData?.signed_url ? (
            <a
              href={signedUrlData.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open PDF
            </a>
          ) : (
            <span className="text-xs text-gray-400">Not available</span>
          )}
        </div>

        {/* Submission Meta */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <Badge label={submission.status} variant={statusVariant[submission.status]} />
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Signature</p>
            <p className="text-sm font-semibold text-gray-700 capitalize">{submission.signature_type}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Submitted</p>
            <p className="text-sm font-semibold text-gray-700">
              {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Signature Preview */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Signature</p>
          <div className="border border-gray-200 rounded-xl p-4 bg-white">
            {submission.signature_type === 'drawn' ? (
              <img
                src={submission.signature_data}
                alt="Candidate signature"
                className="max-h-24 object-contain"
              />
            ) : (
              <p className="font-signature text-2xl text-gray-800 italic">{submission.signature_data}</p>
            )}
          </div>
        </div>

        {/* Question Answers */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Answers ({answers.filter(a => !a.is_draft).length}/{questions.length} completed)
          </p>
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-gray-400">No questions configured.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => {
                const answer = getAnswer(q.id)
                return (
                  <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      <span className="text-gray-400 mr-1">{i + 1}.</span> {q.title}
                      {q.is_required && <span className="ml-1 text-red-400 text-xs">*</span>}
                    </p>
                    {answer ? (
                      <p className="text-sm text-gray-900 bg-blue-50 rounded-lg px-3 py-2">
                        {answer.response_text || JSON.stringify(answer.response_json) || '—'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Not answered</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes + Actions — only for submitted status */}
        {submission.status === 'submitted' && (
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Notes for candidate (optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                placeholder="Add a note…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="danger"
                onClick={() => onUpdate('rejected', notes)}
                loading={isUpdating}
              >
                Reject
              </Button>
              <Button
                onClick={() => onUpdate('accepted', notes)}
                loading={isUpdating}
              >
                Accept
              </Button>
            </div>
          </div>
        )}

        {/* Already reviewed */}
        {submission.status !== 'submitted' && (
          <div className="border-t border-gray-100 pt-4">
            {submission.notes && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{submission.notes}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export function SubmissionsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Submission | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => submissionService.getAll(),
  })

  const { data: candidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => userService.getCandidates(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: SubmissionStatus; notes: string }) =>
      submissionService.updateStatus(id, status, notes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] })
      setSelected(null)
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const getCandidateName = (candidateId: string) =>
    candidates?.find((c: User) => c.id === candidateId)?.full_name ?? candidateId.slice(0, 8) + '…'

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage candidate offer letter submissions</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Signature</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.submissions.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No submissions yet</td></tr>
              )}
              {data?.submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{getCandidateName(s.candidate_id)}</td>
                  <td className="px-4 py-3">
                    <Badge label={s.status} variant={statusVariant[s.status]} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{s.signature_type}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="secondary" onClick={() => setSelected(s)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ReviewModal
          submission={selected}
          onClose={() => setSelected(null)}
          onUpdate={(status, notes) =>
            updateMutation.mutate({ id: selected.id, status, notes })
          }
          isUpdating={updateMutation.isPending}
        />
      )}
    </div>
  )
}
