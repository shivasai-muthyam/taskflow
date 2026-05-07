import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import type { Role } from '@/types/domain'

export const SignupPage = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('member')

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { error } = await authService.signUp(email, password, fullName, role)
    if (error) return toast.error(error.message)
    toast.success(`Account created as ${role}. Check your email.`)
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ddd6fe,transparent_45%)] p-4">
      <form onSubmit={onSubmit} className="glass-card w-full max-w-md p-6">
        <h1 className="mb-1 text-2xl font-semibold">Create account</h1>
        <p className="mb-4 text-sm text-slate-500">Start managing projects with your team.</p>
        <input className="text-input mb-3" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="text-input mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="text-input mb-3" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select className="text-input mb-3" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button className="primary-btn w-full">Create account</button>
        <div className="mt-4 text-sm">
          <Link className="text-indigo-600 hover:text-indigo-700" to="/login">Already have an account?</Link>
        </div>
      </form>
    </div>
  )
}
