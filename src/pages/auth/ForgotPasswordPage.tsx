import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const { error } = await authService.resetPassword(email)
    if (error) return toast.error(error.message)
    toast.success('Password reset email sent')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#bfdbfe,transparent_45%)] p-4">
      <form onSubmit={onSubmit} className="glass-card w-full max-w-md p-6">
        <h1 className="mb-1 text-2xl font-semibold">Reset password</h1>
        <p className="mb-4 text-sm text-slate-500">We will email you a reset link.</p>
        <input className="text-input mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="primary-btn w-full">Send reset link</button>
        <div className="mt-4 text-sm">
          <Link className="text-indigo-600 hover:text-indigo-700" to="/login">Back to login</Link>
        </div>
      </form>
    </div>
  )
}
