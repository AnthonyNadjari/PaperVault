import imageCompression from 'browser-image-compression'
import { supabase, BUCKET } from './supabase'

const MAX_SIZE = 1200
const QUALITY = 0.85

export async function compressImage(file: File): Promise<File> {
  const opts = {
    maxWidthOrHeight: MAX_SIZE,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: QUALITY,
  }
  return imageCompression(file, opts)
}

export async function uploadReceiptImage(docId: string, file: File, index: number): Promise<string> {
  const compressed = await compressImage(file)
  const ext = (compressed.name.split('.').pop() ?? 'jpg').toLowerCase() || 'jpg'
  const key = `${docId}/${index}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(key, compressed, {
    upsert: true,
    contentType: compressed.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}
