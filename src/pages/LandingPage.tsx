import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const LandingPage = () => {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#c7d2fe,transparent_45%)] p-6">
      <div className="mx-auto max-w-5xl py-16">
        <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          TaskFlow Pro
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Project and Task Management with Admin/Member Role Access
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Build, assign, and track projects with a modern dashboard. Admins manage projects and team members, while members
          focus on assigned work and status updates.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {session ? (
            <Link className="primary-btn" to="/dashboard">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link className="primary-btn" to="/login">
                Sign In
              </Link>
              <Link
                className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                to="/signup"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <FeatureCard title="Authentication" text="Signup/login with protected routes and session handling." />
          <FeatureCard title="Project & Team" text="Create projects, assign members, and control role-based access." />
          <FeatureCard title="Task Tracking" text="Assign tasks, set due dates, and monitor overdue/completion status." />
        </div>
      </div>
    </div>
  )
}

const FeatureCard = ({ title, text }: { title: string; text: string }) => (
  <div className="glass-card p-4">
    <p className="font-semibold text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-600">{text}</p>
  </div>
)

