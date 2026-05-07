export type Role = 'admin' | 'member'
export type ProjectStatus = 'planned' | 'active' | 'on_hold' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'overdue'
export type Priority = 'low' | 'medium' | 'high'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  due_date: string | null
  priority: Priority
  status: ProjectStatus
  owner_id: string
  progress: number
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  assignee_id: string
  creator_id: string
  status: TaskStatus
  priority: Priority
  due_date: string | null
  created_at: string
}
