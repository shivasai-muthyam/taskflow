import { apiClient } from '@/lib/api'

const safe = async <T>(fn: () => Promise<T>) => {
  try {
    const data = await fn()
    return { data, error: null as Error | null }
  } catch (error) {
    return { data: null as T | null, error: error as Error }
  }
}

export const taskService = {
  list: async (projectId?: string) =>
    safe(() => apiClient.get(`/api/tasks${projectId ? `?projectId=${projectId}` : ''}`)),
  create: async (payload: Record<string, unknown>) =>
    safe(() => apiClient.post('/api/tasks', payload)),
  updateStatus: async (taskId: string, status: string) =>
    safe(() => apiClient.patch(`/api/tasks/${taskId}/status`, { status })),
  addComment: async () => ({ data: null, error: new Error('Not implemented yet') }),
}
