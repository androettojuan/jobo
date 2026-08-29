import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Une clases de Tailwind resolviendo conflictos (p.ej. p-2 vs p-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
