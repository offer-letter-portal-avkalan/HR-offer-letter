import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Save, CheckCircle } from 'lucide-react'
import { questionService } from '@/services/question.service'
import { answerService } from '@/services/answer.service'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Question, Answer } from '@/types'

function QuestionItem({ question, answer, onSave }: {
  question: Question
  answer: Answer | undefined
  onSave: (questionId: string, value: string, isDraft: boolean) => void
}) {
  const [value, setValue] = useState(answer?.response_text ?? '')
  const [dirty, setDirty] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = (val: string) => {
    setValue(val)
    setDirty(true)
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      onSave(question.id, val, true)
      setDirty(false)
    }, 1500)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 text-sm">
            {question.title}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {question.description && <p className="text-xs text-gray-500 mt-0.5">{question.description}</p>}
        </div>
        {answer && !answer.is_draft && (
          <CheckCircle size={18} className="text-green-500 shrink-0" />
        )}
      </div>

      {question.question_type === 'text' && (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          rows={3}
          placeholder="Your answer…"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {question.question_type === 'yes_no' && (
        <div className="flex gap-3">
          {['Yes', 'No'].map((opt) => (
            <button
              key={opt}
              onClick={() => handleChange(opt)}
              className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                value === opt ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.question_type === 'multiple_choice' && question.options && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={value === opt}
                onChange={() => handleChange(opt)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.question_type === 'rating' && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => handleChange(String(n))}
              className={`w-10 h-10 rounded-full border text-sm font-semibold transition-colors ${
                value === String(n) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {dirty && <p className="text-xs text-gray-400 mt-2">Auto-saving…</p>}

      <div className="flex justify-end mt-3">
        <Button
          size="sm"
          onClick={() => { onSave(question.id, value, false); setDirty(false) }}
          disabled={!value.trim()}
        >
          <Save size={13} /> Save
        </Button>
      </div>
    </div>
  )
}

export function CandidateQuestionsPage() {
  const qc = useQueryClient()

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ['active-questions'],
    queryFn: questionService.getActive,
  })

  const { data: answersData, isLoading: aLoading } = useQuery({
    queryKey: ['my-answers'],
    queryFn: answerService.getMyAnswers,
  })

  const saveMutation = useMutation({
    mutationFn: ({ questionId, value, isDraft }: { questionId: string; value: string; isDraft: boolean }) =>
      answerService.upsert({ question_id: questionId, response_text: value, is_draft: isDraft }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['my-answers'] })
      if (!vars.isDraft) toast.success('Answer saved')
    },
  })

  const answerMap = new Map(answersData?.answers.map((a) => [a.question_id, a]))

  if (qLoading || aLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  const answered = answersData?.answers.filter((a) => !a.is_draft).length ?? 0
  const total = questions?.filter((q) => q.is_required).length ?? 0

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
        <p className="text-gray-500 text-sm mt-1">{answered} of {total} required questions answered</p>
        <div className="mt-2 bg-gray-200 rounded-full h-2 w-64">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {questions?.length === 0 && (
          <p className="text-gray-400 text-center py-12">No questions have been added yet.</p>
        )}
        {questions?.map((q) => (
          <QuestionItem
            key={q.id}
            question={q}
            answer={answerMap.get(q.id)}
            onSave={(qId, val, draft) => saveMutation.mutate({ questionId: qId, value: val, isDraft: draft })}
          />
        ))}
      </div>
    </div>
  )
}
