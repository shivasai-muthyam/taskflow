import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { taskService } from '@/services/task.service'
import { profileService } from '@/services/profile.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/types/domain'
import { getDerivedTaskStatus } from '@/utils/taskStatus'

const columns = ['todo', 'in_progress', 'completed', 'overdue'] as const

export const TasksPage = () => {
  const { role, user } = useAuth()
  const { projects } = useProjects()
  const { tasks, refresh } = useTasks()
  const [query, setQuery] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const canCreateTasks = role === 'admin'

  useEffect(() => {
    const loadProfiles = async () => {
      const { data } = await profileService.list()
      setProfiles((data ?? []) as Profile[])
    }
    void loadProfiles()
  }, [])

  const filtered = useMemo(
    () => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())),
    [query, tasks],
  )

  const updateStatus = async (taskId: string, status: string) => {
    const { error } = await taskService.updateStatus(taskId, status)
    if (error) return toast.error(error.message)
    await refresh()
  }

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canCreateTasks) return toast.error('Only admins can create tasks')
    if (!projectId || !assigneeId || !title) return toast.error('Fill all required fields')

    const { error } = await taskService.create({
      title,
      project_id: projectId,
      assignee_id: assigneeId,
      creator_id: user?.id,
      due_date: dueDate || null,
      priority,
      status: 'todo',
    })

    if (error) return toast.error(error.message)
    setTitle('')
    setDueDate('')
    await refresh()
    toast.success('Task created')
  }

  return (
    <div className="space-y-6">
      <h1 className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-2xl font-semibold text-transparent">Task Board</h1>
      {canCreateTasks && (
        <Card className="p-3">
          <form className="grid gap-2 md:grid-cols-2" onSubmit={createTask}>
            <input className="text-input md:col-span-2" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="text-input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <select className="text-input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Assign to member</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
            <input className="text-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <select className="text-input" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <button className="primary-btn md:col-span-2">Create Task</button>
          </form>
        </Card>
      )}
      <input className="text-input" placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((status) => (
          <Card key={status} className="p-3">
            <div className="mb-3">
              <Badge tone={status}>{status.replace('_', ' ')}</Badge>
            </div>
            <div className="space-y-2">
              {filtered
                .filter((task) => getDerivedTaskStatus(task) === status)
                .map((task) => {
                  const derived = getDerivedTaskStatus(task)
                  return (
                    <div key={task.id} className="rounded-lg border border-indigo-100 bg-white/70 p-2">
                      <p className="font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'} | Priority: {task.priority}
                      </p>
                      <select
                        className="mt-2 w-full rounded-lg border border-slate-200 p-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                        value={derived}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                      >
                        {columns.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
