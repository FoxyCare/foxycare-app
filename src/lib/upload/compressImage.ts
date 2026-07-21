const MAX_DIMENSION = 800
const QUALITY = 0.82
const MAX_INPUT_BYTES = 15 * 1024 * 1024 // reject absurdly large files before even decoding

export class ImageCompressionError extends Error {}

// Resizes to MAX_DIMENSION on the longest edge and re-encodes as WebP —
// plenty sharp for an avatar (displayed at a few hundred px at most) while
// keeping Supabase Storage usage low. Falls back to JPEG if the browser's
// canvas can't encode WebP (very old Safari).
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new ImageCompressionError('Wybrany plik nie jest obrazem.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageCompressionError('Plik jest za duży (limit 15 MB).')
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageCompressionError('Przeglądarka nie wspiera przetwarzania obrazu.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALITY)
  )
  if (blob) return blob

  const fallback = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  )
  if (!fallback) throw new ImageCompressionError('Nie udało się przetworzyć obrazu.')
  return fallback
}
