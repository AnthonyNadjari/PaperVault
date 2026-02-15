import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDocuments, searchDocuments } from '../lib/documents'
import type { Document } from '../types'

function formatDate(d: string | null): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByMonth(docs: Document[]): { label: string; docs: Document[] }[] {
  const groups: Record<string, Document[]> = {}
  for (const doc of docs) {
    const d = doc.date ? new Date(doc.date) : new Date(doc.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(doc)
  }
  const sorted = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  return sorted.map(([key, docs]) => {
    const parts = key.split('-')
    const y = parts[0] ?? ''
    const m = parts[1] ?? '1'
    const label = `${monthNames[parseInt(m, 10) - 1] ?? ''} ${y}`
    return { label, docs }
  })
}

export default function Archive() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = query.trim() ? await searchDocuments(query) : await getDocuments()
      setDocs(list)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const t = setTimeout(load, query.trim() ? 200 : 0)
    return () => clearTimeout(t)
  }, [load, query])

  const groups = groupByMonth(docs)

  return (
    <div className="mx-auto max-w-content px-4 pb-6">
      <div className="sticky top-0 z-10 bg-surface pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/scan')}
            className="shrink-0 rounded-button bg-ink px-4 py-2.5 text-sm font-medium text-white"
          >
            + Scan
          </button>
          <input
            type="search"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 rounded-input border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted">Chargement…</div>
      ) : docs.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted">
          {query.trim() ? 'Aucun résultat.' : 'Aucun document. Utilisez « + Scan » pour ajouter un reçu.'}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, docs: groupDocs }) => (
            <section key={label}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{label}</h2>
              <ul className="space-y-0 divide-y divide-border rounded-card border border-border bg-white">
                {groupDocs.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/doc/${doc.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        {doc.image_urls[0] ? (
                          <img
                            src={doc.image_urls[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted text-xs">—</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-ink truncate">{doc.merchant_name || 'Sans nom'}</div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span>{formatDate(doc.date)}</span>
                          {doc.total_amount && <span>· {doc.total_amount} {doc.currency && doc.currency}</span>}
                          {doc.category && <span>· {doc.category}</span>}
                        </div>
                      </div>
                      {doc.warranty_enabled && (
                        <span className="shrink-0 text-amber-600" title="Garantie">🛡</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
