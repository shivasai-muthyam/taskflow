import { supabase } from '@/lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const getToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

const jsonError = async (response: Response) => {
  try {
    const body = await response.json()
    return (body?.error as string) ?? 'API error'
  } catch {
    return 'API error'
  }
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const token = await getToken()
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error(await jsonError(response))
    return (await response.json()) as T
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const token = await getToken()
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(await jsonError(response))
    return (await response.json()) as T
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const token = await getToken()
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(await jsonError(response))
    return (await response.json()) as T
  },
}

