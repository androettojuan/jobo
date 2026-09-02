import { ImagePlus, X } from 'lucide-react'
import { useState } from 'react'

import { PhotoInput } from '@/components/ui/PhotoInput'
import { uploadImage } from '@/lib/storage'

interface PhotoPickerProps {
  label?: string
  hint?: string
  photos: string[]
  onChange: (photos: string[]) => void
  /** Devuelve la ruta de Storage donde guardar el archivo. */
  buildPath: (file: File) => string
  max?: number
}

/** Selector de fotos con subida y vista previa. */
export function PhotoPicker({
  label = 'Fotos',
  hint,
  photos,
  onChange,
  buildPath,
  max = 5,
}: PhotoPickerProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function add(file: File) {
    setError('')
    setUploading(true)
    try {
      const url = await uploadImage(buildPath(file), file)
      onChange([...photos, url])
    } catch {
      setError('No pudimos subir la foto. Probá con otra.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      <ul className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <li key={url} className="relative">
            <img src={url} alt="" className="size-20 rounded-xl object-cover" />
            <button
              type="button"
              aria-label="Quitar foto"
              onClick={() => onChange(photos.filter((photo) => photo !== url))}
              className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-slate-900 text-white"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}

        {photos.length < max && (
          <li>
            <PhotoInput
              aria-label="Agregar una foto"
              disabled={uploading}
              onPick={(file) => void add(file)}
              className="grid size-20 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 text-slate-400 dark:border-slate-700"
            >
              {uploading ? (
                <span
                  aria-label="Subiendo"
                  className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              ) : (
                <ImagePlus className="size-5" aria-hidden />
              )}
            </PhotoInput>
          </li>
        )}
      </ul>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
