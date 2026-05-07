import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getDerivedTaskStatus } from '@/utils/taskStatus'

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { projects } = useProjects()
  const { tasks } = useTasks()

  const stats = useMemo(() => {
    const overdue = tasks.filter((task) => getDerivedTaskStatus(task) === 'overdue').length
    const completed = tasks.filter((task) => task.status === 'completed').length
    return { overdue, completed, totalTasks: tasks.length, totalProjects: projects.length }
  }, [projects.length, tasks])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-2xl font-semibold text-transparent">
          {role === 'admin' ? 'Admin Dashboard' : 'Member Dashboard'}
        </h1>
        <div className="flex items-center gap-2">
          <button className="primary-btn" onClick={() => navigate('/projects')}>
            Projects
          </button>
          <Badge tone={role === 'admin' ? 'active' : 'planned'}>{role ?? 'member'}</Badge>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Projects" value={stats.totalProjects} onClick={() => navigate('/projects')} />
        <StatCard title="Tasks" value={stats.totalTasks} />
        <StatCard title="Completed" value={stats.completed} />
        <StatCard title="Overdue" value={stats.overdue} />
      </div>
    </div>
  )
}

const StatCard = ({ title, value, onClick }: { title: string; value: number; onClick?: () => void }) => (
  <Card className={onClick ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-xl' : undefined}>
    <button className="w-full text-left" onClick={onClick} type="button">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-1 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-semibold text-transparent">{value}</p>
    </button>
  </Card>
)
