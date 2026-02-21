import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StorageImage } from '../components/StorageImage'
import { getDocuments } from '../lib/documents'
import type { Document } from '../types'

function formatDate(d: string | null, created: string): string {
  if (d) return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return new Date(created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Photos() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocuments()
      .then(setDocs)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Chargement…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-content px-4 pb-6">
      <div className="grid grid-cols-3 gap-2">
        {docs.map((doc) => {
          const thumb = doc.image_urls[0]
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => navigate(`/doc/${doc.id}`)}
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100"
            >
              {thumb ? (
                <StorageImage
                  pathOrUrl={thumb}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted text-xs">
                  —
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-left text-white text-xs">
                <div className="font-medium truncate">{doc.merchant_name || 'Sans nom'}</div>
                <div className="opacity-90">{formatDate(doc.date, doc.created_at)}</div>
              </div>
            </button>
          )
        })}
      </div>
      {docs.length === 0 && (
        <div className="py-12 text-center text-sm text-muted">
          Aucune photo. Ajoutez des reçus depuis l’onglet Archive.
        </div>
      )}
    </div>
  )
}
