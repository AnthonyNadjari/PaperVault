import { useEffect, useState } from 'react'
import { getSignedUrl } from '../lib/storage'

interface StorageImageProps {
  pathOrUrl: string | undefined
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  expiresIn?: number
}

function isValidPathOrUrl(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

export function StorageImage({
  pathOrUrl,
  alt = '',
  className,
  loading = 'lazy',
  expiresIn = 60 * 60 * 24,
}: StorageImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setLoadError(false)
    let isMounted = true

    async function load() {
      if (!isValidPathOrUrl(pathOrUrl)) {
        if (isMounted) setUrl(null)
        return
      }
      const signedUrl = await getSignedUrl(pathOrUrl, expiresIn)
      if (isMounted) {
        setUrl(signedUrl)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [pathOrUrl, expiresIn])

  if (!isValidPathOrUrl(pathOrUrl)) {
    return (
      <div
        className={className}
        style={{
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        }}
      />
    )
  }

  if (!url || loadError) {
    return (
      <div
        className={`${className ?? ''} animate-pulse`}
        style={{
          background: '#e5e5e5',
          minHeight: 48,
        }}
      />
    )
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        console.error('Image failed to load:', pathOrUrl)
        setLoadError(true)
      }}
    />
  )
}
