import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '@/services/api'

const schema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  position: z.string().min(2, 'Position is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

const STEPS = ['Personal Details', 'Account Setup']

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') === 'hr_admin' ? 'hr_admin' : 'candidate'
  const isHR = role === 'hr_admin'
  const [step, setStep] = useState(0)
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const goNext = async () => {
    const ok = await trigger(['first_name', 'last_name', 'email', 'position'])
    if (ok) setStep(1)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: `${data.first_name.trim()} ${data.last_name.trim()}`,
        role,
      })
      toast.success(`${isHR ? 'HR Admin' : 'Candidate'} account created! Please sign in.`)
      navigate(`/login?portal=${role}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Registration failed. Please try again.')
    }
  }

  const Field = ({
    label, name, type = 'text', placeholder, icon, error, end,
  }: {
    label: string
    name: keyof FormData
    type?: string
    placeholder: string
    icon: React.ReactNode
    error?: string
    end?: React.ReactNode
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full pl-11 ${end ? 'pr-12' : 'pr-4'} py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${error ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'}`}
          {...register(name)}
        />
        {end && <div className="absolute right-4 top-1/2 -translate-y-1/2">{end}</div>}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )

  const EmailIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
  const LockIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
  const UserIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
  const BriefcaseIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
  const PhoneIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )

  const EyeToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
      {show ? (
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
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background shapes */}
      <div className="absolute top-[-80px] right-[-100px] w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[400px] h-[400px] bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-gray-900">Avkalan<span className="text-blue-600">.ai</span></span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100/60 p-8 sm:p-10 border border-white/80">

          <div className="mb-7">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${isHR ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
              {isHR ? '🛡️ HR Admin Registration' : '👤 Candidate Registration'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5">Create your account</h1>
            <p className="text-gray-500 text-sm">{isHR ? 'Set up your HR Admin portal access' : 'Join as a candidate to view your offer letter'}</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}>
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-medium flex-1 ${i === step ? 'text-gray-800' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* STEP 0 — Personal details */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First name" name="first_name" placeholder="John" icon={<UserIcon />} error={errors.first_name?.message} />
                  <Field label="Last name" name="last_name" placeholder="Smith" icon={<UserIcon />} error={errors.last_name?.message} />
                </div>
                <Field label="Email address" name="email" type="email" placeholder="you@company.com" icon={<EmailIcon />} error={errors.email?.message} />
                <Field label="Position / Job Title" name="position" placeholder="e.g. Software Engineer" icon={<BriefcaseIcon />} error={errors.position?.message} />
                <Field label="Phone number (optional)" name="phone" type="tel" placeholder="+91 98765 43210" icon={<PhoneIcon />} error={errors.phone?.message} />

                <button type="button" onClick={goNext}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 text-sm mt-2">
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            )}

            {/* STEP 1 — Account setup */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><LockIcon /></span>
                    <input type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Minimum 8 characters"
                      className={`w-full pl-11 pr-12 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'}`}
                      {...register('password')} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2"><EyeToggle show={showPw} toggle={() => setShowPw(v => !v)} /></div>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><LockIcon /></span>
                    <input type={showCPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat your password"
                      className={`w-full pl-11 pr-12 py-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${errors.confirm_password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50 hover:bg-white focus:bg-white'}`}
                      {...register('confirm_password')} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2"><EyeToggle show={showCPw} toggle={() => setShowCPw(v => !v)} /></div>
                  </div>
                  {errors.confirm_password && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.confirm_password.message}</p>}
                </div>

                <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700">
                  <p className="font-semibold mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">✓</span> Minimum 8 characters</li>
                    <li className="flex items-center gap-2"><span className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold text-[10px]">✓</span> Both passwords must match</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep(0)}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold py-3.5 rounded-xl transition-all text-sm hover:bg-gray-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 text-sm">
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create Account
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-7 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Sign in →
              </Link>
            </p>
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
