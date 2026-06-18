import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { questionService } from '@/services/question.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { Question } from '@/types'

const schema = z.object({
  title: z.string().min(5, 'At least 5 characters'),
  description: z.string().optional(),
  question_type: z.enum(['text', 'multiple_choice', 'yes_no', 'rating']),
  is_required: z.boolean(),
  display_order: z.coerce.number().min(0),
})
type FormData = z.infer<typeof schema>

function QuestionForm({ defaultValues, onSave, onClose }: {
  defaultValues?: Partial<FormData>
  onSave: (data: FormData) => Promise<void>
  onClose: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { question_type: 'text', is_required: true, display_order: 0, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <Input label="Question title" error={errors.title?.message} {...register('title')} />
      <Input label="Description (optional)" error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" {...register('question_type')}>
            <option value="text">Text</option>
            <option value="yes_no">Yes / No</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="rating">Rating</option>
          </select>
        </div>
        <Input label="Display order" type="number" error={errors.display_order?.message} {...register('display_order')} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" className="rounded" {...register('is_required')} />
        Required question
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Save</Button>
      </div>
    </form>
  )
}

export function QuestionsPage() {
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<Question | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['questions-all'],
    queryFn: () => questionService.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => questionService.create({ ...d, options: undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions-all'] }); setShowCreate(false); toast.success('Question created') },
    onError: () => toast.error('Failed to create question'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormData> }) => questionService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions-all'] }); setEditTarget(null); toast.success('Question updated') },
    onError: () => toast.error('Failed to update question'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions-all'] }); toast.success('Question deleted') },
    onError: () => toast.error('Failed to delete question'),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage candidate onboarding questions</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Add Question
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {data?.questions.length === 0 && (
            <p className="text-center text-gray-400 py-16">No questions yet. Add your first one.</p>
          )}
          {data?.questions.map((q) => (
            <div key={q.id} className="flex items-start justify-between p-4 hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">{q.title}</span>
                  {q.is_required && <Badge label="Required" variant="blue" />}
                  {!q.is_active && <Badge label="Inactive" variant="gray" />}
                  <Badge label={q.question_type} variant="gray" />
                </div>
                {q.description && <p className="text-xs text-gray-500">{q.description}</p>}
              </div>
              <div className="flex gap-1 ml-4">
                <Button size="sm" variant="ghost" onClick={() => setEditTarget(q)}>
                  <Pencil size={14} />
                </Button>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => { if (confirm('Delete this question?')) deleteMutation.mutate(q.id) }}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Question">
        <QuestionForm onSave={async (d) => { await createMutation.mutateAsync(d) }} onClose={() => setShowCreate(false)} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Question">
        {editTarget && (
          <QuestionForm
            defaultValues={{ ...editTarget, description: editTarget.description ?? undefined }}
            onSave={async (d) => { await updateMutation.mutateAsync({ id: editTarget.id, data: d }) }}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}
