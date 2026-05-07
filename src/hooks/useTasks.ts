import { useEffect, useState } from 'react'
import { taskService } from '@/services/task.service'
import type { Task } from '@/types/domain'
import { toast } from 'sonner'

export const useTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const { data, error } = await taskService.list(projectId)
    if (error) toast.error(error.message)
    setTasks((data ?? []) as Task[])
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await taskService.list(projectId)
      if (!active) return
      if (error) toast.error(error.message)
      setTasks((data ?? []) as Task[])
      setLoading(false)
    }
    void load()

    return () => {
      active = false
    }
  }, [projectId])

  return { tasks, loading, refresh }
}
