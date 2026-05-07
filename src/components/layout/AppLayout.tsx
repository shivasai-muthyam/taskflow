import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, ListTodo, Users, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/team', label: 'Team', icon: Users },
]

export const AppLayout = () => {
  const { profile, signOut } = useAuth()
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('taskflow-theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('taskflow-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="app-shell flex">
      <aside className="hidden min-h-screen w-72 flex-col border-r border-indigo-100 bg-white/80 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 lg:flex">
        <Link to="/dashboard" className="mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-bold text-transparent">
          TaskFlow Pro
        </Link>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300',
                  isActive && 'bg-indigo-50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
            <div className="flex items-center gap-4 lg:hidden">
              <Link to="/dashboard" className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-lg font-bold text-transparent">
                TaskFlow Pro
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-300">{profile?.full_name}</span>
              <button className="primary-btn !py-1.5" onClick={() => signOut()}>
                Logout
              </button>
            </div>
          </div>
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    isActive && 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-slate-700 dark:text-indigo-300',
                  )
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
