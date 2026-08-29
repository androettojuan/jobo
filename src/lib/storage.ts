import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'

import { storage } from '@/lib/firebase'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * Achica la imagen antes de subirla: las fotos de un celular pesan varios MB
 * y en el chat no aportan nada por encima de 1600px.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))

  // Ya es chica: la subimos tal cual y evitamos recomprimir.
  if (scale === 1 && file.size <= MAX_IMAGE_BYTES) return file

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  return blob ?? file
}

/** Sube una imagen ya comprimida y devuelve su URL pública. */
export async function uploadImage(path: string, file: File) {
  const blob = await compressImage(file)
  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen es demasiado pesada.')
  }

  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(fileRef)
}

/** Carpeta única para los adjuntos de una solicitud todavía no creada. */
export function newAttachmentFolder() {
  return crypto.randomUUID()
}
