import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RowsSkeleton } from '@/components/ui/skeletons'
import { listReports, resolveReport, setUserDisabled } from '@/features/admin/api'
import { ReportedMessage } from '@/features/admin/components/ReportedMessage'
import { ReportedReview } from '@/features/admin/components/ReportedReview'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'
import type { Report, ReportStatus } from '@/types/models'

const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: 'open', label: 'Abiertas' },
  { value: 'resolved', label: 'Resueltas' },
  { value: 'dismissed', label: 'Descartadas' },
]

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  fraud: 'Estafa',
  abuse: 'Maltrato',
  fake_profile: 'Perfil falso',
  no_show: 'No se presentó',
  other: 'Otro',
}

export function AdminReportsPage() {
  const { firebaseUser } = useAuth()
  const [status, setStatus] = useState<ReportStatus>('open')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})

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
    await resolveReport(report.id, firebaseUser.uid, next, notes[report.id] ?? '')
    setReports((prev) => prev.filter((r) => r.id !== report.id))
  }

  async function suspend(report: Report) {
    await setUserDisabled(report.targetId, true)
    await resolve(report, 'resolved')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {STATUSES.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              'rounded-full px-3 py-1 text-sm',
              tab.value === status
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <RowsSkeleton />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nada para moderar"
          description="No hay denuncias en este estado."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <p className="text-sm font-medium">
                {REASON_LABELS[report.reason] ?? report.reason} · {report.targetType}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{report.details}</p>

              {(report.targetType === 'user' || report.targetType === 'professional') && (
                <Link
                  to={`/profesional/${report.targetId}`}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Ver perfil denunciado
                </Link>
              )}

              {report.targetType === 'review' && <ReportedReview reviewId={report.targetId} />}

              {report.targetType === 'message' && <ReportedMessage report={report} />}

              {report.status === 'open' && (
                <>
                  <Input
                    placeholder="Nota interna (opcional)"
                    value={notes[report.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void resolve(report, 'resolved')}>
                      Resolver
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void resolve(report, 'dismissed')}
                    >
                      Descartar
                    </Button>
                    {(report.targetType === 'user' || report.targetType === 'professional') && (
                      <Button size="sm" variant="danger" onClick={() => void suspend(report)}>
                        Suspender cuenta
                      </Button>
                    )}
                  </div>
                </>
              )}

              {report.resolution && (
                <p className="text-xs text-slate-500">Nota: {report.resolution}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
