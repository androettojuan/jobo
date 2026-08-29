import { Tags } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  approveCategory,
  listPendingCategories,
  mergeCategory,
  rejectCategory,
} from '@/features/admin/api'
import { CATEGORIES } from '@/lib/categories'
import type { Category } from '@/types/models'

export function AdminCategoriesPage() {
  const [pending, setPending] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [names, setNames] = useState<Record<string, string>>({})
  const [merges, setMerges] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    listPendingCategories()
      .then((list) => {
        if (cancelled) return
        setPending(list)
        setNames(Object.fromEntries(list.map((c) => [c.id, c.name])))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function remove(id: string) {
    setPending((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Oficios que propusieron los profesionales. Aprobalos, renombralos o unificalos con uno que
        ya exista para no tener duplicados.
      </p>

      {pending.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No hay oficios para revisar"
          description="Cuando alguien proponga un oficio nuevo va a aparecer acá."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((category) => (
            <li
              key={category.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <p className="text-xs text-slate-500">Propuesto como “{category.name}”</p>

              <Input
                label="Nombre definitivo"
                value={names[category.id] ?? ''}
                onChange={(e) => setNames((prev) => ({ ...prev, [category.id]: e.target.value }))}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await approveCategory(category.id, names[category.id])
                    remove(category.id)
                  }}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await rejectCategory(category.id)
                    remove(category.id)
                  }}
                >
                  Rechazar
                </Button>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label
                    htmlFor={`merge-${category.id}`}
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    O unificar con
                  </label>
                  <select
                    id={`merge-${category.id}`}
                    value={merges[category.id] ?? ''}
                    onChange={(e) =>
                      setMerges((prev) => ({ ...prev, [category.id]: e.target.value }))
                    }
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Elegir oficio existente</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!merges[category.id]}
                  onClick={async () => {
                    const target = merges[category.id]
                    if (!target) return
                    await mergeCategory(category.id, target)
                    remove(category.id)
                  }}
                >
                  Unificar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
