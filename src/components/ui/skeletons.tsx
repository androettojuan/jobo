import { Skeleton, SkeletonScreen } from '@/components/ui/Skeleton'

/**
 * Esqueletos por forma de pantalla. La idea es que lo gris se parezca a lo que
 * viene después: si el hueco tiene el tamaño del contenido real, la pantalla
 * no salta cuando llegan los datos.
 */

/** Cabecera con título y la campana al lado. */
function HeaderBar() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="size-10 rounded-full" />
    </div>
  )
}

/** Filas de tarjeta con título y subtítulo: solicitudes, denuncias, listados. */
export function CardListSkeleton({ rows = 4, header = true }: { rows?: number; header?: boolean }) {
  return (
    <SkeletonScreen className="flex flex-col gap-4 p-4">
      {header && <HeaderBar />}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}

/** Lista con foto redonda a la izquierda: chats y avisos. */
export function AvatarListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonScreen className="flex flex-col gap-4 p-4">
      <HeaderBar />
      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}

/** Ficha pública del profesional: foto grande centrada, datos y reseñas. */
export function ProfileSkeleton() {
  return (
    <SkeletonScreen className="flex flex-col gap-6 p-4">
      <Skeleton className="h-4 w-16" />

      <div className="flex flex-col items-center gap-2">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-32" />
        <div className="mt-1 flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl" />
    </SkeletonScreen>
  )
}

/** Formularios: perfil, perfil profesional, solicitud nueva, reseña. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <SkeletonScreen className="flex flex-col gap-5 p-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-xl" />
    </SkeletonScreen>
  )
}

/** Panel del profesional: los cuatro números y las solicitudes recibidas. */
export function DashboardSkeleton() {
  return (
    <SkeletonScreen className="flex flex-col gap-5 p-4">
      <HeaderBar />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </SkeletonScreen>
  )
}

/** Globos de chat, alternados como la conversación real. */
export function MessagesSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <SkeletonScreen className="flex flex-col gap-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          className={
            i % 2 === 0 ? 'h-10 w-2/3 rounded-2xl' : 'h-10 w-1/2 self-end rounded-2xl bg-brand-100'
          }
        />
      ))}
    </SkeletonScreen>
  )
}

/** Resultados de búsqueda en la home: tarjetas con foto y dos líneas. */
export function ProfessionalListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonScreen className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
        >
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
        </div>
      ))}
    </SkeletonScreen>
  )
}

/** Listas dentro de una pantalla ya dibujada: el panel de admin. */
export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <SkeletonScreen className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </SkeletonScreen>
  )
}
