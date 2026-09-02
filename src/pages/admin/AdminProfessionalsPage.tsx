import { BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { RowsSkeleton } from '@/components/ui/skeletons'
import { listProfessionals, setProfessionalVerified } from '@/features/admin/api'
import { CATEGORIES_BY_ID } from '@/lib/categories'
import type { Professional } from '@/types/models'

export function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyUnverified, setOnlyUnverified] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listProfessionals(onlyUnverified)
      .then((list) => {
        if (!cancelled) setProfessionals(list)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onlyUnverified])

  async function toggleVerified(professional: Professional) {
    const verified = !professional.verified
    await setProfessionalVerified(professional.uid, verified)
    setProfessionals((prev) =>
      prev.map((p) => (p.uid === professional.uid ? { ...p, verified } : p)),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyUnverified}
          onChange={(e) => setOnlyUnverified(e.target.checked)}
          className="size-4"
        />
        Ver solo los que faltan verificar
      </label>

      {loading ? (
        <RowsSkeleton />
      ) : professionals.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No hay profesionales"
          description="Todavía nadie activó su perfil profesional."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {professionals.map((professional) => (
            <li
              key={professional.uid}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profesional/${professional.uid}`}
                  className="truncate font-medium hover:underline"
                >
                  {professional.displayName}
                </Link>
                <p className="truncate text-sm text-slate-500">
                  {professional.categoryIds
                    .map((id) => CATEGORIES_BY_ID.get(id)?.name ?? id)
                    .join(' · ')}
                </p>
                <p className="text-xs text-slate-400">
                  {professional.locality?.name ?? 'Sin localidad'} · {professional.status} ·{' '}
                  {professional.ratingCount} reseñas
                </p>
              </div>
              <Button
                size="sm"
                variant={professional.verified ? 'secondary' : 'primary'}
                onClick={() => void toggleVerified(professional)}
              >
                {professional.verified ? 'Quitar verificación' : 'Verificar'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
