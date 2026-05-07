import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

const colorMap: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  planned: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

export const Badge = ({ children, tone }: { children: ReactNode; tone?: string }) => (
  <span className={cn('rounded-full px-2 py-1 text-xs font-medium', tone ? colorMap[tone] : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200')}>
    {children}
  </span>
)
