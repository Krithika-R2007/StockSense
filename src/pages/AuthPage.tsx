import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail, Package } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/toast/ToastContext'
import { Button } from '../components/ui/Button'

export function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format'
    if (!password.trim()) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password, remember)
      navigate('/dashboard')
    } catch (err) {
      if (!navigator.onLine) {
        toast('Unable to reach server. Check your connection.', 'error')
      } else {
        toast('Invalid email or password.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Hero Panel */}
      <div className="relative hidden w-[60%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1a1d29] via-[#1e3a5f] to-[#0f2744] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/15 backdrop-blur-sm">
            <Package className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold tracking-tight">InvenTrack</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            Intelligent Inventory Control
          </h1>
          <p className="mt-5 text-base leading-relaxed text-blue-200/90">
            Real-time stock tracking, AI-powered forecasting, and blockchain audit trails
            — all in one platform. Manage batches, transfers, and purchase orders
            across every warehouse with clarity and control.
          </p>
        </div>

        {/* Animated warehouse illustration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-20 left-20 h-40 w-40 rounded-[20px] border-2 border-white/30 bg-white/5 animate-pulse" />
          <div className="absolute bottom-32 left-72 h-56 w-32 rounded-[16px] border-2 border-white/20 bg-white/5 animate-pulse [animation-delay:1s]" />
          <div className="absolute bottom-16 right-40 h-48 w-36 rounded-[16px] border-2 border-white/25 bg-white/5 animate-pulse [animation-delay:0.5s]" />
          <div className="absolute bottom-24 right-20 h-32 w-28 rounded-[12px] border-2 border-white/20 bg-white/5 animate-pulse [animation-delay:1.5s]" />
          <div className="absolute bottom-44 left-[45%] h-24 w-52 rounded-[16px] border-2 border-white/15 bg-white/3 animate-pulse [animation-delay:2s]" />
        </div>

        <p className="relative z-10 text-xs text-blue-300/60">© 2026 InvenTrack</p>
      </div>

      {/* Right Login Panel */}
      <div className="flex flex-1 flex-col bg-app">
        {/* Mobile header */}
        <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-[#1a1d29] to-primary px-4 py-3 lg:hidden">
          <Package className="h-5 w-5 text-white" />
          <span className="text-sm font-semibold text-white">InvenTrack</span>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-[420px]">
            {/* Logo */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary shadow-lg">
              <Package className="h-7 w-7 text-white" />
            </div>

            <h2 className="text-center text-2xl font-bold text-text">
              Welcome Back
            </h2>
            <p className="mt-2 text-center text-sm text-muted">
              Sign in to your inventory dashboard
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
                    placeholder="you@company.com"
                    className={`h-11 w-full rounded-[8px] border bg-surface pl-10 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? 'border-error' : 'border-border'}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-error">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
                    placeholder="••••••••"
                    className={`h-11 w-full rounded-[8px] border bg-surface pl-10 pr-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-error' : 'border-border'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-error">{errors.password}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-border"
                  />
                  Remember me
                </label>
                <button type="button" className="text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={loading}
                icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-center text-sm text-muted">
              Need access?{' '}
              <button type="button" className="font-medium text-primary hover:underline">
                Contact your administrator
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
