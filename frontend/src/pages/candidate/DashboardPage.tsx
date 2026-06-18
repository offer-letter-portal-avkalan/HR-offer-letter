import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { HelpCircle, FileText, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { answerService } from '@/services/answer.service'
import { submissionService } from '@/services/submission.service'
import { offerLetterService } from '@/services/offer_letter.service'
import { questionService } from '@/services/question.service'
import { Badge } from '@/components/ui/Badge'
import type { SubmissionStatus } from '@/types'

const statusVariant: Record<SubmissionStatus, 'blue' | 'green' | 'red' | 'gray'> = {
  pending: 'gray', submitted: 'blue', accepted: 'green', rejected: 'red',
}

export function CandidateDashboardPage() {
  const { user } = useAuth()

  const { data: questions } = useQuery({ queryKey: ['active-questions'], queryFn: questionService.getActive })
  const { data: answers } = useQuery({ queryKey: ['my-answers'], queryFn: answerService.getMyAnswers })
  const { data: submission } = useQuery({ queryKey: ['my-submission'], queryFn: submissionService.getMy })
  const { data: offerLetter } = useQuery({ queryKey: ['my-offer-letter'], queryFn: offerLetterService.getMy })

  const totalRequired = questions?.filter((q) => q.is_required).length ?? 0
  const answeredCount = answers?.answers.filter((a) => !a.is_draft).length ?? 0
  const progress = totalRequired > 0 ? Math.round((answeredCount / totalRequired) * 100) : 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user?.full_name}</h1>
      <p className="text-gray-500 mb-8">Complete the steps below to accept your offer letter.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 rounded-lg"><HelpCircle size={18} className="text-purple-600" /></div>
            <span className="font-semibold text-gray-800">Questions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{answeredCount}/{totalRequired}</p>
          <div className="mt-2 bg-gray-100 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg"><FileText size={18} className="text-blue-600" /></div>
            <span className="font-semibold text-gray-800">Offer Letter</span>
          </div>
          {offerLetter ? (
            <><p className="text-sm text-green-600 font-medium">✓ Available</p><p className="text-xs text-gray-400 mt-1">{offerLetter.original_filename}</p></>
          ) : (
            <p className="text-sm text-gray-400">Not uploaded yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              {submission ? <CheckCircle size={18} className="text-green-600" /> : <Clock size={18} className="text-gray-400" />}
            </div>
            <span className="font-semibold text-gray-800">Submission</span>
          </div>
          {submission ? (
            <Badge label={submission.status} variant={statusVariant[submission.status]} />
          ) : (
            <p className="text-sm text-gray-400">Not submitted</p>
          )}
        </div>
      </div>

      {!submission && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="space-y-3">
            {[
              { label: 'Answer all required questions', done: progress === 100, to: '/candidate/questions' },
              { label: 'Review your offer letter', done: !!offerLetter, to: '/candidate/offer-letter' },
              { label: 'Sign and submit', done: false, to: '/candidate/offer-letter' },
            ].map((step, i) => (
              <Link key={i} to={step.to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${step.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{step.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {submission?.status === 'accepted' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
          <h2 className="text-lg font-semibold text-green-800">Offer Accepted!</h2>
          <p className="text-green-600 text-sm mt-1">Congratulations! Your offer letter has been accepted.</p>
        </div>
      )}
    </div>
  )
}
