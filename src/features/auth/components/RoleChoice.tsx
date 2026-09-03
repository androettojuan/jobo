import { Briefcase, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Qué viene a hacer alguien que se registra. */
export type Role = 'cliente' | 'profesional'

const OPCIONES: { id: Role; icono: LucideIcon; titulo: string; detalle: string }[] = [
  {
    id: 'cliente',
    icono: Search,
    titulo: 'Busco a alguien',
    detalle: 'Necesito resolver algo en mi casa o mi trabajo.',
  },
  {
    id: 'profesional',
    icono: Briefcase,
    titulo: 'Ofrezco mis servicios',
    detalle: 'Quiero que me encuentren y me contraten en mi zona.',
  },
]

/**
 * La pregunta del registro. Cambia a dónde va la persona después de crear la
 * cuenta: quien busca entra directo a la app, y quien ofrece servicios pasa por
 * el perfil profesional, que sin completarlo no lo encuentra nadie.
 *
 * No es un dato que quede guardado: la cuenta es una sola y cualquiera puede
 * activar su perfil profesional después. Es solo por dónde arranca.
 */
export function RoleChoice({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
        ¿Qué te trae por acá?
      </legend>
      <div className="flex flex-col gap-2">
        {OPCIONES.map(({ id, icono: Icono, titulo, detalle }) => {
          const activa = value === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={activa}
              onClick={() => onChange(id)}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors',
                // En oscuro el fondo va slate y el verde queda en el borde,
                // como en el resto de la app (`RequestCard`, `InstallPrompt`).
                activa
                  ? 'border-brand-500 bg-brand-50 dark:bg-slate-900'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              <Icono
                className={cn(
                  'mt-0.5 size-5 shrink-0',
                  activa ? 'text-brand-600' : 'text-slate-400',
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{titulo}</span>
                <span className="block text-xs text-slate-500">{detalle}</span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
