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
  const key = `${docId}/${index}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(key, compressed, {
    upsert: true,
    contentType: 'image/jpeg',
  })
  if (error) {
    if (error.message?.toLowerCase().includes('bucket') && error.message?.toLowerCase().includes('not found')) {
      throw new Error('BUCKET_NOT_FOUND')
    }
    throw error
  }
  return key
}
