import { useEffect, useState } from 'react'
import { projectService } from '@/services/project.service'
import type { Project } from '@/types/domain'
import { toast } from 'sonner'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const { data, error } = await projectService.list()
    if (error) toast.error(typeof error === 'string' ? error : error.message)
    setProjects((data ?? []) as Project[])
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await projectService.list()
      if (!active) return
      if (error) toast.error(typeof error === 'string' ? error : error.message)
      setProjects((data ?? []) as Project[])
      setLoading(false)
    }
    void load()

    return () => {
      active = false
    }
  }, [])

  return { projects, loading, refresh }
}
