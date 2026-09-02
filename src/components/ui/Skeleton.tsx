import { cn } from '@/lib/utils'

/**
 * Bloque gris que late mientras se carga. Va siempre dentro de un contenedor
 * con `role="status"`: por sí solo no significa nada para un lector de
 * pantalla, así que se marca `aria-hidden`.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('block animate-pulse rounded bg-slate-200 dark:bg-slate-800', className)}
    />
  )
}

/**
 * Envoltorio de cualquier pantalla en carga. Anuncia "Cargando…" una sola vez
 * en lugar de dejar que el lector recorra las cajas vacías.
 */
export function SkeletonScreen({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-busy aria-label="Cargando…" className={className}>
      {children}
    </div>
  )
}
