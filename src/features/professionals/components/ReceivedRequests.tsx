import { ClipboardList } from 'lucide-react'

import { EmptyState } from '@/components/EmptyState'
import { RequestCard } from '@/features/requests/components/RequestCard'
import type { JobRequest } from '@/types/models'

/** Las solicitudes que le llegaron al profesional, ya filtradas y ordenadas. */
export function ReceivedRequests({
  requests,
  filtered,
  failed,
}: {
  requests: JobRequest[]
  /** true si hay un oficio elegido: cambia el texto del vacío. */
  filtered: boolean
  failed: boolean
}) {
  return (
    <section>
      <h2 className="mb-3 font-semibold">Solicitudes recibidas</h2>

      {failed && (
        <p className="text-sm text-red-600">
          No pudimos cargar tus solicitudes. Revisá la conexión y volvé a entrar.
        </p>
      )}

      {!failed &&
        (requests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={filtered ? 'Nada por este oficio' : 'Todavía no te escribieron'}
            description={
              filtered
                ? 'Probá sacando el filtro para ver el resto de tus solicitudes.'
                : 'Cuando alguien de tu zona te contacte lo vas a ver acá.'
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((request) => (
              <li key={request.id}>
                <RequestCard request={request} aside={request.locality?.name} />
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
