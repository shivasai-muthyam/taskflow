import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('glass-card p-4', className)}>{children}</div>
)
