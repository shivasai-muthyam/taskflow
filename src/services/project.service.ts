import { apiClient } from '@/lib/api'

const safe = async <T>(fn: () => Promise<T>) => {
  try {
    const data = await fn()
    return { data, error: null as Error | null }
  } catch (error) {
    return { data: null as T | null, error: error as Error }
  }
}

export const projectService = {
  list: async () =>
    safe(() => apiClient.get('/api/projects')),
  create: async (payload: Record<string, unknown>) =>
    safe(() => apiClient.post('/api/projects', payload)),
  update: async () => ({ data: null, error: new Error('Not implemented yet') }),
  remove: async () => ({ data: null, error: new Error('Not implemented yet') }),
  members: async (projectId: string) =>
    safe(() => apiClient.get(`/api/projects/${projectId}/members`)),
  addMember: async (projectId: string, userId: string, role: 'admin' | 'member' = 'member') =>
    safe(() => apiClient.post(`/api/projects/${projectId}/members`, { userId, role })),
  removeMember: async () => ({ data: null, error: new Error('Not implemented yet') }),
}
