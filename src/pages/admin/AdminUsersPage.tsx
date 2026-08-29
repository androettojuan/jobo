import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { findUsers, setUserDisabled } from '@/features/admin/api'
import type { User } from '@/types/models'

export function AdminUsersPage() {
  const [term, setTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Debounce simple: no consultamos en cada tecla.
    const timer = setTimeout(() => {
      findUsers(term)
        .then((list) => {
          if (!cancelled) setUsers(list)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term])

  async function toggleDisabled(user: User) {
    const disabled = !user.disabled
    await setUserDisabled(user.uid, disabled)
    setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, disabled } : u)))
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Buscar"
        placeholder="Nombre o email"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin resultados"
          description="Probá con otro nombre o email."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li
              key={user.uid}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{user.displayName}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
                {user.disabled && <p className="text-xs text-red-600">Cuenta suspendida</p>}
              </div>
              <Button
                size="sm"
                variant={user.disabled ? 'secondary' : 'danger'}
                onClick={() => void toggleDisabled(user)}
              >
                {user.disabled ? 'Reactivar' : 'Suspender'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
