import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

/**
 * Abre la cámara o la galería del sistema y devuelve la foto elegida, o
 * `null` si la persona canceló.
 *
 * Adentro del contenedor nativo un `<input type="file">` funciona, pero abre
 * el explorador de archivos: para mandar una foto en un chat, lo que hace
 * falta es la cámara. Además Apple pide (regla 4.2) que la app use funciones
 * del dispositivo de verdad, no solo la web adentro de una ventana.
 */
export async function pickPhoto(): Promise<File | null> {
  let webPath: string | undefined
  try {
    // `Prompt` deja elegir entre sacar una foto y buscarla en la galería.
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.Uri,
      quality: 90,
      // La compresión de verdad la hace `compressImage` antes de subir; acá
      // solo se evita cargar en memoria una foto de 12 megapíxeles.
      width: 1600,
    })
    webPath = photo.webPath
  } catch {
    // El plugin lanza también cuando cancelan, que no es un error que haya
    // que mostrarle a nadie.
    return null
  }

  if (!webPath) return null

  // El plugin deja la foto en un archivo temporal y devuelve una URL local
  // para leerla. Si esa lectura falla no hay nada que mostrar, y tratarlo
  // como "no eligió nada" es más honesto que subir un archivo vacío.
  const response = await fetch(webPath)
  if (!response.ok) return null

  const blob = await response.blob()
  if (blob.size === 0) return null

  return new File([blob], `foto-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' })
}
