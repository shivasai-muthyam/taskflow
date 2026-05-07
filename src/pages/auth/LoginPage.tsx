import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { error } = await authService.signIn(email, password)
    if (error) return toast.error(error.message)
    toast.success('Welcome back')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#c7d2fe,transparent_45%)] p-4">
      <form onSubmit={onSubmit} className="glass-card w-full max-w-md p-6">
        <h1 className="mb-1 text-2xl font-semibold">Welcome back</h1>
        <p className="mb-4 text-sm text-slate-500">Sign in to manage projects and team tasks.</p>
        <input className="text-input mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="text-input mb-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="primary-btn w-full">Sign in</button>
        <div className="mt-4 flex justify-between text-sm">
          <Link className="text-indigo-600 hover:text-indigo-700" to="/signup">Create account</Link>
          <Link className="text-indigo-600 hover:text-indigo-700" to="/forgot-password">Forgot password?</Link>
        </div>
      </form>
    </div>
  )
}
