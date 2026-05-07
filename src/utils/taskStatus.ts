import type { Task, TaskStatus } from '@/types/domain'

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const getDerivedTaskStatus = (task: Task): TaskStatus => {
  if (task.status === 'completed') return 'completed'

  if (task.due_date) {
    // `due_date` is a `date` (YYYY-MM-DD). Parse as local midnight to avoid UTC shifts.
    const due = new Date(`${task.due_date}T00:00:00`).getTime()
    if (due < startOfToday()) return 'overdue'
  }

  // If the DB still has `overdue` but due_date is no longer in the past, treat it as todo.
  return task.status === 'overdue' ? 'todo' : task.status
}

