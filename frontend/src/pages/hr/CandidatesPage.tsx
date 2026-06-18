import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { userService } from '@/services/user.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

const schema = z.object({
  full_name: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
})
type FormData = z.infer<typeof schema>

export function CandidatesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => userService.getCandidates(),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => userService.create({ ...d, role: 'candidate' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      setShowCreate(false)
      reset()
      toast.success('Candidate created')
    },
    onError: () => toast.error('Failed to create candidate'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      userService.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 text-sm mt-1">Manage candidate accounts</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus size={16} /> Add Candidate
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates?.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No candidates yet</td></tr>
              )}
              {candidates?.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3">
                    <Badge label={c.is_active ? 'Active' : 'Inactive'} variant={c.is_active ? 'green' : 'gray'} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive.mutate({ id: c.id, is_active: !c.is_active })}
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset() }} title="Add Candidate">
        <form onSubmit={handleSubmit((d) => createMutation.mutateAsync(d))} className="space-y-4">
          <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Temporary password" type="password" error={errors.password?.message} {...register('password')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset() }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
