import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { listReports, resolveReport } from '@/features/admin/api'
import { useAuth } from '@/features/auth/useAuth'
import type { Report, ReportStatus } from '@/types/models'

const TABS: { value: ReportStatus; label: string }[] = [
  { value: 'open', label: 'Abiertas' },
  { value: 'reviewing', label: 'En revisión' },
  { value: 'resolved', label: 'Resueltas' },
  { value: 'dismissed', label: 'Descartadas' },
]

export function AdminPage() {
  const { firebaseUser } = useAuth()
  const [status, setStatus] = useState<ReportStatus>('open')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listReports(status)
      .then((list) => {
        if (!cancelled) setReports(list)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [status])

  async function resolve(report: Report, next: 'resolved' | 'dismissed') {
    if (!firebaseUser) return
    await resolveReport(report.id, firebaseUser.uid, next, '')
    setReports((prev) => prev.filter((r) => r.id !== report.id))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Administración</h1>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={
              tab.value === status
                ? 'shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-sm text-white'
                : 'shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nada para moderar"
          description="No hay denuncias en este estado."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li key={report.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-sm font-medium">
                {report.targetType} · {report.reason}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{report.details}</p>
              <p className="mt-1 text-xs text-slate-400">Objetivo: {report.targetId}</p>
              {status === 'open' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => void resolve(report, 'resolved')}>
                    Resolver
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void resolve(report, 'dismissed')}>
                    Descartar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
