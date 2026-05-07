import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { projectService } from '@/services/project.service'
import { profileService } from '@/services/profile.service'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Profile } from '@/types/domain'
import { getDerivedTaskStatus } from '@/utils/taskStatus'

export const ProjectsPage = () => {
  const { role, user } = useAuth()
  const { projects, refresh } = useProjects()
  const { tasks } = useTasks()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'planned' | 'active' | 'on_hold' | 'completed'>('active')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [memberSelection, setMemberSelection] = useState<Record<string, string>>({})
  const [membersByProjectId, setMembersByProjectId] = useState<
    Record<string, { user_id: string; profiles?: { full_name?: string; email?: string } }[]>
  >({})

  useEffect(() => {
    const loadProfiles = async () => {
      const { data } = await profileService.list()
      setProfiles((data ?? []) as Profile[])
    }
    void loadProfiles()
  }, [])

  useEffect(() => {
    const loadMembers = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          const { data } = await projectService.members(project.id)
          return [project.id, (data ?? []) as { user_id: string; profiles?: { full_name?: string; email?: string } }[]] as const
        }),
      )
      setMembersByProjectId(Object.fromEntries(entries))
    }
    void loadMembers()
  }, [projects])

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.id) return toast.error('Please login again')
    if (role !== 'admin') return toast.error('Only admins can create projects')

    const { error } = await projectService.create({
      name,
      description,
      due_date: dueDate || null,
      owner_id: user?.id,
      status,
      priority,
      progress: 0,
    })
    if (error) return toast.error(error.message)
    setName('')
    setDescription('')
    setDueDate('')
    await refresh()
    toast.success('Project created')
  }

  const addMember = async (projectId: string) => {
    const memberId = memberSelection[projectId]
    if (!memberId) return
    const { error } = await projectService.addMember(projectId, memberId)
    if (error) return toast.error(error.message)
    await refresh()
    toast.success('Member added to project')
  }

  const removableMembers = useMemo(
    () =>
      projects.reduce<Record<string, string[]>>((acc, project) => {
        const currentIds = (membersByProjectId[project.id] ?? []).map((m) => m.user_id)
        acc[project.id] = profiles.filter((profile) => !currentIds.includes(profile.id)).map((profile) => profile.id)
        return acc
      }, {}),
    [membersByProjectId, profiles, projects],
  )

  const getProjectMetrics = (projectId: string) => {
    const projectTasks = tasks.filter((task) => task.project_id === projectId)
    const total = projectTasks.length
    const completed = projectTasks.filter((task) => task.status === 'completed').length
    const overdue = projectTasks.filter((task) => getDerivedTaskStatus(task) === 'overdue').length
    const dueSoon = projectTasks.filter((task) => {
      if (!task.due_date || task.status === 'completed') return false
      const due = new Date(`${task.due_date}T00:00:00`).getTime()
      const now = Date.now()
      const inThreeDays = now + 3 * 24 * 60 * 60 * 1000
      return due >= now && due <= inThreeDays
    }).length
    const completion = total ? Math.round((completed / total) * 100) : 0
    return { total, completed, overdue, dueSoon, completion, projectTasks }
  }

  return (
    <div className="space-y-6">
      <h1 className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-2xl font-semibold text-transparent">Projects</h1>
      {user && role === 'admin' && (
        <Card className="p-3">
          <form onSubmit={createProject} className="grid gap-2 md:grid-cols-2">
            <input className="text-input md:col-span-2" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="text-input md:col-span-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input className="text-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <select className="text-input" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select className="text-input" value={status} onChange={(e) => setStatus(e.target.value as 'planned' | 'active' | 'on_hold' | 'completed')}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <button className="primary-btn">Create</button>
          </form>
        </Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            {(() => {
              const metrics = getProjectMetrics(project.id)
              return (
                <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">{project.name}</h2>
              <Badge tone={project.status}>{project.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-slate-500">{project.description || 'No description added yet.'}</p>
            <p className="mt-1 text-xs text-slate-500">
              Due: {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'} | Priority: {project.priority}
            </p>
            <p className="text-sm text-slate-500">Progress: {metrics.completion}%</p>
            <div className="mt-2 h-2 rounded-full bg-indigo-100">
              <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${metrics.completion}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-100/80 p-2 text-slate-600">Tasks: <span className="font-semibold">{metrics.total}</span></div>
              <div className="rounded-lg bg-slate-100/80 p-2 text-slate-600">Completed: <span className="font-semibold">{metrics.completed}</span></div>
              <div className="rounded-lg bg-amber-100/70 p-2 text-amber-700">Due soon: <span className="font-semibold">{metrics.dueSoon}</span></div>
              <div className="rounded-lg bg-rose-100/70 p-2 text-rose-700">Overdue: <span className="font-semibold">{metrics.overdue}</span></div>
            </div>
            {metrics.projectTasks.length > 0 && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming due tasks</p>
                <div className="space-y-1">
                  {metrics.projectTasks
                    .filter((task) => task.due_date && getDerivedTaskStatus(task) !== 'overdue' && getDerivedTaskStatus(task) !== 'completed')
                    .sort(
                      (a, b) =>
                        new Date(`${a.due_date ?? ''}T00:00:00`).getTime() - new Date(`${b.due_date ?? ''}T00:00:00`).getTime(),
                    )
                    .slice(0, 3)
                    .map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-md bg-slate-100/70 px-2 py-1 text-xs">
                        <span className="truncate">{task.title}</span>
                        <span className="text-slate-500">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {(role === 'admin' || project.owner_id === user?.id) && (
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team members</p>
                <div className="flex flex-wrap gap-1">
                  {(membersByProjectId[project.id] ?? []).length > 0 ? (
                    (membersByProjectId[project.id] ?? []).map((member) => (
                      <Badge key={member.user_id} tone="planned">
                        {member.profiles?.full_name ?? member.profiles?.email ?? 'Member'}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No members assigned</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    className="text-input"
                    value={memberSelection[project.id] ?? ''}
                    onChange={(e) => setMemberSelection((prev) => ({ ...prev, [project.id]: e.target.value }))}
                  >
                    <option value="">Select member</option>
                    {profiles.map((profile) => {
                      const alreadyAdded = !(removableMembers[project.id] ?? []).includes(profile.id)
                      return (
                        <option key={profile.id} value={profile.id} disabled={alreadyAdded}>
                          {profile.full_name} ({profile.email}){alreadyAdded ? ' — already added' : ''}
                        </option>
                      )
                    })}
                  </select>
                  <button className="primary-btn" onClick={() => addMember(project.id)} type="button">
                    Assign
                  </button>
                </div>
              </div>
            )}
                </>
              )
            })()}
          </Card>
        ))}
      </div>
    </div>
  )
}
