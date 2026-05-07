import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

type GuestProject = {
  id: string
  name: string
  description: string
  status: 'planned' | 'active' | 'on_hold' | 'completed'
  dueDate?: string
}

type GuestTask = {
  id: string
  projectId: string
  title: string
  assignee: string
  status: 'todo' | 'in_progress' | 'completed' | 'overdue'
  dueDate?: string
}

const projectKey = 'taskflow-guest-projects'
const taskKey = 'taskflow-guest-tasks'

const readSession = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeSession = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(key, JSON.stringify(value))
}

const newId = () => Math.random().toString(36).slice(2, 10)

export const GuestDemoPage = () => {
  const [projects, setProjects] = useState<GuestProject[]>(() => readSession(projectKey, []))
  const [tasks, setTasks] = useState<GuestTask[]>(() => readSession(taskKey, []))

  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectStatus, setProjectStatus] = useState<GuestProject['status']>('active')
  const [projectDueDate, setProjectDueDate] = useState('')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('Guest User')
  const [taskStatus, setTaskStatus] = useState<GuestTask['status']>('todo')
  const [taskDueDate, setTaskDueDate] = useState('')

  const stats = useMemo(() => {
    const overdue = tasks.filter((task) => task.status === 'overdue').length
    const completed = tasks.filter((task) => task.status === 'completed').length
    return {
      projectCount: projects.length,
      taskCount: tasks.length,
      overdue,
      completed,
    }
  }, [projects, tasks])

  const createProject = (event: React.FormEvent) => {
    event.preventDefault()
    if (!projectName.trim()) return
    const next: GuestProject[] = [
      ...projects,
      {
        id: newId(),
        name: projectName.trim(),
        description: projectDescription.trim(),
        status: projectStatus,
        dueDate: projectDueDate || undefined,
      },
    ]
    setProjects(next)
    writeSession(projectKey, next)
    setProjectName('')
    setProjectDescription('')
    setProjectDueDate('')
  }

  const createTask = (event: React.FormEvent) => {
    event.preventDefault()
    if (!taskTitle.trim() || !taskProjectId) return
    const next: GuestTask[] = [
      ...tasks,
      {
        id: newId(),
        title: taskTitle.trim(),
        projectId: taskProjectId,
        assignee: taskAssignee.trim() || 'Guest User',
        status: taskStatus,
        dueDate: taskDueDate || undefined,
      },
    ]
    setTasks(next)
    writeSession(taskKey, next)
    setTaskTitle('')
    setTaskDueDate('')
  }

  const updateTaskStatus = (taskId: string, status: GuestTask['status']) => {
    const next = tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
    setTasks(next)
    writeSession(taskKey, next)
  }

  const clearGuestData = () => {
    window.sessionStorage.removeItem(projectKey)
    window.sessionStorage.removeItem(taskKey)
    setProjects([])
    setTasks([])
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#c7d2fe,transparent_45%)] p-6 dark:bg-[radial-gradient(circle_at_top,#312e81,transparent_45%)]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Guest Mode (Temporary)</p>
            <h1 className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-3xl font-bold text-transparent">
              Try TaskFlow without signing in
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Guest data is stored only for this browser session and is cleared on close.</p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
              onClick={clearGuestData}
            >
              Clear guest data
            </button>
            <Link className="primary-btn" to="/login">
              Sign in
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Projects" value={stats.projectCount} />
          <Stat title="Tasks" value={stats.taskCount} />
          <Stat title="Completed" value={stats.completed} />
          <Stat title="Overdue" value={stats.overdue} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Create Project</h2>
            <form className="grid gap-2" onSubmit={createProject}>
              <input className="text-input" placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              <input
                className="text-input"
                placeholder="Description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select className="text-input" value={projectStatus} onChange={(e) => setProjectStatus(e.target.value as GuestProject['status'])}>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
                <input className="text-input" type="date" value={projectDueDate} onChange={(e) => setProjectDueDate(e.target.value)} />
              </div>
              <button className="primary-btn inline-flex items-center gap-1">
                <Plus size={14} /> Add Project
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Create Task</h2>
            <form className="grid gap-2" onSubmit={createTask}>
              <input className="text-input" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <select className="text-input" value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)}>
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <input className="text-input" placeholder="Assignee name" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <select className="text-input" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as GuestTask['status'])}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                <input className="text-input" type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
              <button className="primary-btn inline-flex items-center gap-1">
                <Plus size={14} /> Add Task
              </button>
            </form>
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Task Board</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {(['todo', 'in_progress', 'completed', 'overdue'] as const).map((column) => (
              <div key={column} className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.replace('_', ' ')}</p>
                  <Badge tone={column}>{tasks.filter((task) => task.status === column).length}</Badge>
                </div>
                <div className="space-y-2">
                  {tasks
                    .filter((task) => task.status === column)
                    .map((task) => (
                      <div key={task.id} className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-sm font-medium dark:text-slate-100">{task.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{projects.find((project) => project.id === task.projectId)?.name ?? 'Unknown project'}</p>
                        <select
                          className="mt-2 w-full rounded border border-slate-300 p-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as GuestTask['status'])}
                        >
                          <option value="todo">Todo</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Project Snapshot</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No projects yet. Create one to see team/task progress in guest mode.</p>
            ) : (
              projects.map((project) => {
                const projectTasks = tasks.filter((task) => task.projectId === project.id)
                const completed = projectTasks.filter((task) => task.status === 'completed').length
                const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0

                return (
                  <div key={project.id} className="rounded-xl border border-indigo-100 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{project.name}</p>
                      <Badge tone={project.status === 'on_hold' ? 'planned' : project.status}>{project.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{project.description || 'No description'}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{projectTasks.length} tasks</span>
                      <span>{progress}% complete</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

const Stat = ({ title, value }: { title: string; value: number }) => (
  <Card className="transition hover:-translate-y-0.5 hover:shadow-xl">
    <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p>
    <p className="mt-1 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-semibold text-transparent">{value}</p>
  </Card>
)

