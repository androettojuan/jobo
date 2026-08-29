import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Icon className="size-10 text-slate-300 dark:text-slate-700" aria-hidden />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-xs text-sm text-slate-500">{description}</p>
      {action}
    </div>
  )
}
