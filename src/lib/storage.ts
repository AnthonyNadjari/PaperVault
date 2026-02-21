import { supabase, BUCKET } from './supabase'

const DEFAULT_EXPIRES_IN = 60 * 60 * 24 // 24 hours

/**
 * Returns a URL suitable for <img src>: either the string unchanged if it's
 * already http(s), or a signed URL for the given storage path.
 */
export async function getSignedUrl(
  pathOrUrl: string,
  expiresIn: number = DEFAULT_EXPIRES_IN
): Promise<string | null> {
  const raw = typeof pathOrUrl === 'string' ? pathOrUrl.trim() : ''
  if (!raw) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw
  }
  const path = raw.replace(/^\//, '')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn)
  if (error) {
    console.error('Error creating signed URL:', error)
    return null
  }
  return data?.signedUrl ?? null
}
