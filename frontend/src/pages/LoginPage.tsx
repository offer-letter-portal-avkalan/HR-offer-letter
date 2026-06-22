import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

type Portal = 'hr_admin' | 'candidate'

const PORTALS: { id: Portal; label: string; icon: JSX.Element; color: string; ring: string; bg: string; heading: string; sub: string }[] = [
  {
    id: 'hr_admin',
    label: 'HR Admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'text-indigo-600',
    ring: 'ring-indigo-500',
    bg: 'bg-indigo-600',
    heading: 'HR Admin Portal',
    sub: 'Manage candidates, offer letters & submissions',
  },
  {
    id: 'candidate',
    label: 'Candidate',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'text-blue-600',
    ring: 'ring-blue-500',
    bg: 'bg-blue-600',
    heading: 'Candidate Portal',
    sub: 'View your offer letter, answer questions & sign',
  },
]

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [portal, setPortal] = useState<Portal>('candidate')

  const active = PORTALS.find(p => p.id === portal)!

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) navigate(user.role === 'hr_admin' ? '/hr' : '/candidate', { replace: true })
  }, [user, navigate])

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        ?? 'Invalid email or password. Please try again.'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-100px] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-80px] w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-gray-900">Avkalan<span className="text-blue-600">.ai</span></span>
          </Link>
        </div>

        {/* Portal selector */}
        <div className="flex gap-3 mb-4">
          {PORTALS.map(p => (
            <button
              key={p.id}
              onClick={() => setPortal(p.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 font-semibold text-sm transition-all
                ${portal === p.id
                  ? `border-transparent ${p.bg} text-white shadow-lg`
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100/60 p-8 sm:p-10 border border-white/80">

          <div className="mb-8">
            <div className={`inline-flex items-center gap-2 ${active.color} bg-opacity-10 mb-3`}>
              {active.icon}
              <span className={`text-xs font-bold uppercase tracking-wider ${active.color}`}>{active.label} Login</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5">{active.heading}</h1>
            <p className="text-gray-500 text-sm">{active.sub}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                    ${errors.email ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-12 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                    ${errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2.5 ${active.bg} hover:opacity-90 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-sm mt-2`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in as {active.label}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            {portal === 'hr_admin' ? (
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link
                  to="/register?role=hr_admin"
                  className="font-semibold hover:underline text-indigo-600 hover:text-indigo-700"
                >
                  Register as HR Admin →
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Your account is created by HR.{' '}
                <span className="font-medium text-gray-600">Contact your HR team for access.</span>
              </p>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {[['🔒', 'SSL Encrypted'], ['🛡️', 'GDPR Ready'], ['✅', 'SOC 2']].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">© 2025 Avkalan.ai · All rights reserved</p>
      </div>
    </div>
  )
}
