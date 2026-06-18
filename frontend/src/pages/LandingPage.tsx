import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ── hero slides — gradient-based, no external images ── */
const SLIDES = [
  {
    gradient: 'from-[#0d1b2e] via-[#1a2e4a] to-[#0f3460]',
    accent: 'from-blue-500/30 to-indigo-600/20',
    tag: 'TALENT ACQUISITION',
    heading: 'Simplified Offer\nLetter Management',
    sub: 'Send, track, and collect digitally-signed offer letters — all in one secure platform.',
  },
  {
    gradient: 'from-[#0f2027] via-[#203a43] to-[#2c5364]',
    accent: 'from-teal-500/25 to-cyan-600/15',
    tag: 'DIGITAL SIGNATURES',
    heading: 'Sign Anywhere.\nInstantly.',
    sub: 'Candidates sign from any device in seconds — no printing, no scanning, no delays.',
  },
  {
    gradient: 'from-[#16213e] via-[#0f3460] to-[#533483]',
    accent: 'from-purple-500/25 to-pink-600/15',
    tag: 'HR DASHBOARD',
    heading: 'Complete Visibility\nFor Your HR Team.',
    sub: 'Manage candidates, questions, and submissions from one powerful dashboard.',
  },
  {
    gradient: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
    accent: 'from-indigo-500/30 to-blue-700/20',
    tag: 'SECURE & COMPLIANT',
    heading: 'Enterprise Security\nBuilt In.',
    sub: 'JWT auth, watermarked PDFs, role-based access, and encrypted cloud storage.',
  },
]

const SERVICES = [
  { icon: '📋', title: 'Smart Questions', desc: 'Create custom onboarding questions — text, yes/no, multiple choice, or rating scale.' },
  { icon: '📄', title: 'PDF Watermarking', desc: 'Auto-stamp every page with CONFIDENTIAL + candidate name upon upload.' },
  { icon: '✍️', title: 'Digital Signature', desc: 'Draw or type a signature directly in the browser. Legally valid, tamper-proof.' },
  { icon: '🔍', title: 'Real-Time Tracking', desc: 'Monitor every offer status — pending, submitted, accepted, or rejected.' },
  { icon: '🔒', title: 'Role-Based Access', desc: 'Separate HR Admin and Candidate portals with JWT-secured fine-grained permissions.' },
  { icon: '🖥️', title: 'Desktop Protection', desc: 'Electron app blocks screenshots and screen recording for confidential PDFs.' },
]

const STEPS = [
  { n: '01', icon: '📝', title: 'HR Creates Questions', desc: 'Set up custom questions tailored to the role and onboarding process.' },
  { n: '02', icon: '📤', title: 'Upload Offer Letter', desc: 'Upload the PDF — it gets watermarked automatically for the candidate.' },
  { n: '03', icon: '💬', title: 'Candidate Responds', desc: 'Candidate logs in, reads the offer, and answers all required questions.' },
  { n: '04', icon: '✅', title: 'Sign & Submit', desc: 'Candidate signs digitally and submits. HR gets instant notification.' },
]

const STATS = [
  { value: '500+', label: 'HR Teams' },
  { value: '10k+', label: 'Offers Processed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 2 min', label: 'Avg Sign Time' },
]

export function LandingPage() {
  const [slide, setSlide] = useState(0)
  const [fading, setFading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => advance(), 5000)
  }

  const advance = () => {
    setFading(true)
    setTimeout(() => { setSlide(s => (s + 1) % SLIDES.length); setFading(false) }, 600)
  }

  useEffect(() => { startTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [])

  const goTo = (i: number) => {
    setFading(true)
    setTimeout(() => { setSlide(i); setFading(false) }, 400)
    startTimer()
  }

  const cur = SLIDES[slide]

  return (
    <div className="font-sans bg-white">

      {/* ══ NAVBAR ══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0d1b2e]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">Avkalan<span className="text-blue-400">.ai</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {['Home', 'Services', 'How It Works', 'Security'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors">{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login"
              className="text-white/80 hover:text-white text-sm font-medium border border-white/25 hover:border-white/50 px-4 py-2 rounded-full transition-all flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login
            </Link>
            <Link to="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-lg">
              Get Started →
            </Link>
          </div>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-[#0d1b2e]/97 border-t border-white/10 px-5 py-4 space-y-3">
            {['Home', 'Services', 'How It Works', 'Security'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="block text-white/80 text-sm py-1" onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1 text-center border border-white/30 text-white text-sm py-2 rounded-full">Login</Link>
              <Link to="/register" className="flex-1 text-center bg-blue-600 text-white text-sm py-2 rounded-full font-semibold">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section id="home" className="relative h-screen overflow-hidden">
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${cur.gradient} transition-all duration-700`} />
        {/* Accent glow */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${cur.accent} pointer-events-none`} />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Floating glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className={`relative z-10 h-full flex items-center transition-all duration-500 ${fading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10 bg-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold tracking-[0.2em] uppercase">{cur.tag}</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6 drop-shadow-lg">
                {cur.heading.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
              </h1>
              <p className="text-white/80 text-lg sm:text-xl mb-10 leading-relaxed max-w-lg">{cur.sub}</p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-full text-sm flex items-center gap-2 shadow-xl hover:-translate-y-0.5 transition-all">
                  Get Started Free →
                </Link>
                <a href="#how-it-works"
                  className="border border-white/40 hover:border-white/70 text-white font-medium px-8 py-3.5 rounded-full text-sm flex items-center gap-2 hover:bg-white/10 transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === slide ? 'bg-white w-8 h-2.5' : 'bg-white/40 w-2.5 h-2.5'}`} />
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-10 right-8 text-white/50 text-sm font-medium hidden md:block z-20">
          {String(slide + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="bg-[#0d1b2e] py-12">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl lg:text-4xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-gray-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ ABOUT / INTRO ══ */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-5">About Our Platform</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              The Smarter Way to<br />Manage Offer Letters
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              Avkalan.ai brings together HR workflows, candidate communication, and digital signing in one
              beautifully simple platform. Say goodbye to email chains and manual paperwork.
            </p>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              From uploading a watermarked offer letter to collecting a legally-valid digital signature —
              everything happens inside a secure, tracked workflow.
            </p>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3 rounded-full text-sm transition-all shadow-lg shadow-blue-200">
              Start Free Today →
            </Link>
          </div>

          {/* Right: dashboard illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 shadow-xl border border-blue-100">
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 bg-white/60 rounded-full h-5 ml-2 flex items-center px-3">
                  <span className="text-[10px] text-gray-400">avkalan.ai/hr/dashboard</span>
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['12', 'Active Offers'], ['8', 'Pending Sign'], ['4', 'Completed']].map(([v, l]) => (
                  <div key={l} className="bg-white rounded-2xl p-3 text-center shadow-sm">
                    <p className="text-xl font-extrabold text-blue-700">{v}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
              {/* Offer letter rows */}
              <div className="space-y-2.5">
                {[
                  { name: 'Priya Sharma', role: 'Sr. Engineer', status: 'Signed', color: 'bg-green-100 text-green-700' },
                  { name: 'Rahul Verma', role: 'Product Manager', status: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
                  { name: 'Aisha Khan', role: 'Designer', status: 'Viewed', color: 'bg-blue-100 text-blue-700' },
                  { name: 'Mohit Jain', role: 'Data Analyst', status: 'Sent', color: 'bg-gray-100 text-gray-600' },
                ].map(({ name, role, status, color }) => (
                  <div key={name} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400">{role}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${color}`}>{status}</span>
                  </div>
                ))}
              </div>
              {/* Bottom bar */}
              <div className="mt-4 bg-blue-600 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-white text-xs font-medium">Send New Offer</span>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2 border border-gray-100">
              <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Offer Accepted!</p>
                <p className="text-[10px] text-gray-400">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">What You Will Get</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Everything HR Needs<br />In One Place
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              A complete, end-to-end platform for HR teams who want to move fast without sacrificing security.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon, title, desc }) => (
              <div key={title}
                className="bg-white rounded-2xl p-7 border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-all duration-300">
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">Simple Process</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">From offer creation to digital acceptance in four effortless steps.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map(({ n, icon, title, desc }, i) => (
              <div key={n} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] right-[-40%] h-px border-t-2 border-dashed border-blue-200 z-0" />
                )}
                <div className="relative z-10 inline-flex mb-5">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                    {icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow">
                    {i + 1}
                  </div>
                </div>
                <div className="text-xs text-blue-400 font-bold tracking-wider mb-1">{n}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MID-PAGE CTA BANNER ══ */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 py-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-blue-200 text-sm font-bold tracking-wider uppercase mb-2">Join 500+ HR Teams</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Transform Your Hiring Process Today
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-7 py-3.5 rounded-full text-sm transition-all shadow-xl flex items-center gap-2 justify-center">
              Start Free — No Credit Card →
            </Link>
            <Link to="/login"
              className="border border-white/40 hover:border-white/70 text-white font-medium px-7 py-3.5 rounded-full text-sm transition-all hover:bg-white/10 flex items-center gap-2 justify-center">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══ SECURITY ══ */}
      <section id="security" className="py-24 bg-[#0d1b2e]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block bg-green-500/15 text-green-400 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-6">Enterprise Security</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
              Built for Security.<br />Trusted by Enterprises.
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Every document, every signature, every candidate response is protected by industry-standard security at every layer.
            </p>
            <div className="space-y-3">
              {[
                ['🔑', 'JWT Authentication', 'Secure access tokens with automatic refresh and revocation.'],
                ['🏛️', 'Row-Level Security', 'Supabase RLS ensures candidates only ever see their own data.'],
                ['🖨️', 'Screenshot Blocking', 'Electron app blocks all OS-level screen capture APIs.'],
                ['📜', 'Watermarked PDFs', 'Every page stamped with CONFIDENTIAL + candidate name.'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} className="flex items-start gap-4 bg-white/5 rounded-xl px-4 py-3.5 border border-white/10 hover:border-green-500/40 transition-colors">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{title as string}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['🔒', 'HTTPS Only'], ['🛡️', 'GDPR Ready'], ['☁️', 'Private Storage'],
              ['🔏', 'Signed URLs'], ['🧂', 'bcrypt Hashing'], ['⚡', 'Rate Limiting'],
              ['🔐', 'RBAC'], ['📧', 'Audit Logs'], ['🌍', 'Global CDN'],
            ].map(([icon, label]) => (
              <div key={label as string} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-white text-xs font-semibold">{label as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to Modernize<br />Your Offer Process?
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Join hundreds of HR teams already using Avkalan.ai to send smarter, faster, more secure offer letters.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 py-4 rounded-full text-sm shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              Get Started Free →
            </Link>
            <Link to="/login" className="border border-white/40 hover:border-white/70 text-white font-semibold px-8 py-4 rounded-full text-sm transition-all hover:bg-white/10">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#060e1c] py-14 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-white font-bold">Avkalan<span className="text-blue-400">.ai</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">Modern offer letter management for forward-thinking HR teams.</p>
            </div>
            {[
              { h: 'Product', links: ['Features', 'Security', 'Pricing', 'Changelog'] },
              { h: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { h: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map(({ h, links }) => (
              <div key={h}>
                <p className="text-white font-semibold text-sm mb-4">{h}</p>
                <ul className="space-y-2.5">
                  {links.map(l => <li key={l}><a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2025 Avkalan.ai. All rights reserved.</p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
