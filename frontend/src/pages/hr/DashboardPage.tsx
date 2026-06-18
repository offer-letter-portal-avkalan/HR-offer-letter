import { useQuery } from '@tanstack/react-query'
import { Users, FileText, HelpCircle, CheckSquare } from 'lucide-react'
import { userService } from '@/services/user.service'
import { questionService } from '@/services/question.service'
import { submissionService } from '@/services/submission.service'
import { Spinner } from '@/components/ui/Spinner'

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Users; label: string; value: number | undefined; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export function HRDashboardPage() {
  const { data: users } = useQuery({ queryKey: ['candidates'], queryFn: () => userService.getCandidates() })
  const { data: questions } = useQuery({ queryKey: ['questions-all'], queryFn: () => questionService.getAll() })
  const { data: submissions } = useQuery({ queryKey: ['submissions'], queryFn: () => submissionService.getAll() })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">HR Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of your offer letter portal activity</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Candidates" value={users?.length} color="bg-blue-500" />
        <StatCard icon={HelpCircle} label="Questions" value={questions?.total} color="bg-purple-500" />
        <StatCard icon={FileText} label="Offer Letters" value={users?.length} color="bg-orange-500" />
        <StatCard icon={CheckSquare} label="Submissions" value={submissions?.total} color="bg-green-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
        {!submissions ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : submissions.submissions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No submissions yet</p>
        ) : (
          <div className="space-y-3">
            {submissions.submissions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 font-mono">{s.id.slice(0, 8)}…</span>
                <span className="text-xs text-gray-400">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  s.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  s.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  s.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>{s.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
