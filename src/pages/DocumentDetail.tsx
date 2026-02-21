import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { StorageImage } from '../components/StorageImage'
import { getDocument, getLineItems, updateDocument, upsertLineItems, deleteDocument } from '../lib/documents'
import type { Document, LineItem, DocumentType } from '../types'
import { CATEGORIES } from '../types'

const TYPES: DocumentType[] = ['receipt', 'invoice', 'warranty', 'other']

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Document | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoaded(false)
    const d = await getDocument(id)
    setDoc(d)
    if (d) {
      const items = await getLineItems(id)
      setLineItems(items)
    }
    setLoaded(true)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(async () => {
    if (!doc) return
    setSaving(true)
    try {
      await updateDocument(doc.id, {
        type: doc.type,
        merchant_name: doc.merchant_name,
        date: doc.date || null,
        total_amount: doc.total_amount,
        currency: doc.currency,
        category: doc.category,
        comment: doc.comment,
        warranty_enabled: doc.warranty_enabled,
        warranty_end_date: doc.warranty_end_date || null,
        warranty_duration: doc.warranty_duration,
        warranty_product_description: doc.warranty_product_description,
      })
      await upsertLineItems(doc.id, lineItems.map((i) => ({ description: i.description, quantity: i.quantity, price: i.price })))
    } finally {
      setSaving(false)
    }
  }, [doc, lineItems])

  const handleDelete = useCallback(async () => {
    if (!doc || !window.confirm('Supprimer ce document ?')) return
    await deleteDocument(doc.id)
    navigate('/')
  }, [doc, navigate])

  if (!id) return null

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted">
        Chargement…
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-muted">
        <p>Document introuvable.</p>
        <button type="button" onClick={() => navigate('/')} className="text-ink underline">Retour</button>
      </div>
    )
  }

  const images = doc.image_urls.length ? doc.image_urls : []
  const currentImage = images[carouselIndex]

  return (
    <div className="mx-auto max-w-content bg-surface pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="text-ink">← Retour</button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-button bg-ink px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={handleDelete} className="text-red-600 text-sm">Supprimer</button>
        </div>
      </header>

      {/* Carousel */}
      <div className="relative aspect-[4/3] w-full bg-neutral-200">
        {currentImage ? (
          <StorageImage
            pathOrUrl={currentImage}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted text-sm">Aucune image</div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCarouselIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setCarouselIndex((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === carouselIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Form */}
      <div className="space-y-4 px-4 pt-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Type</label>
          <select
            value={doc.type}
            onChange={(e) => setDoc((d) => d ? { ...d, type: e.target.value as DocumentType } : d)}
            className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Commerçant</label>
          <input
            type="text"
            value={doc.merchant_name}
            onChange={(e) => setDoc((d) => d ? { ...d, merchant_name: e.target.value } : d)}
            className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
            placeholder="Nom du magasin"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Date</label>
            <input
              type="date"
              value={doc.date ?? ''}
              onChange={(e) => setDoc((d) => d ? { ...d, date: e.target.value || null } : d)}
              className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Montant total</label>
            <input
              type="text"
              value={doc.total_amount}
              onChange={(e) => setDoc((d) => d ? { ...d, total_amount: e.target.value } : d)}
              className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Devise</label>
            <input
              type="text"
              value={doc.currency}
              onChange={(e) => setDoc((d) => d ? { ...d, currency: e.target.value } : d)}
              className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
              placeholder="EUR"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Catégorie</label>
            <select
              value={doc.category}
              onChange={(e) => setDoc((d) => d ? { ...d, category: e.target.value } : d)}
              className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Commentaire</label>
          <textarea
            value={doc.comment}
            onChange={(e) => setDoc((d) => d ? { ...d, comment: e.target.value } : d)}
            className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm min-h-[80px]"
            placeholder="Notes importantes…"
          />
        </div>

        {/* Warranty */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="warranty"
            checked={doc.warranty_enabled}
            onChange={(e) => setDoc((d) => d ? { ...d, warranty_enabled: e.target.checked } : d)}
            className="rounded border-border"
          />
          <label htmlFor="warranty" className="text-sm font-medium">Garantie</label>
        </div>
        {doc.warranty_enabled && (
          <div className="space-y-3 pl-6">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Fin de garantie</label>
              <input
                type="date"
                value={doc.warranty_end_date ?? ''}
                onChange={(e) => setDoc((d) => d ? { ...d, warranty_end_date: e.target.value || null } : d)}
                className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Durée (optionnel)</label>
              <input
                type="text"
                value={doc.warranty_duration}
                onChange={(e) => setDoc((d) => d ? { ...d, warranty_duration: e.target.value } : d)}
                className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
                placeholder="2 ans"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Produit concerné</label>
              <input
                type="text"
                value={doc.warranty_product_description}
                onChange={(e) => setDoc((d) => d ? { ...d, warranty_product_description: e.target.value } : d)}
                className="w-full rounded-input border border-border bg-white px-3 py-2 text-sm"
                placeholder="Ex: MacBook Pro"
              />
            </div>
          </div>
        )}

        {/* Line items */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-muted">Lignes</label>
            <button
              type="button"
              onClick={() => setLineItems((prev) => [...prev, { description: '', quantity: '1', price: '' }])}
              className="text-sm text-ink underline"
            >
              + Ligne
            </button>
          </div>
          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={item.id ?? idx} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => setLineItems((prev) => {
                    const next = [...prev]
                    next[idx] = { ...next[idx]!, description: e.target.value, quantity: next[idx]!.quantity, price: next[idx]!.price }
                    return next
                  })}
                  placeholder="Description"
                  className="min-w-0 flex-1 rounded-input border border-border bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => setLineItems((prev) => {
                    const next = [...prev]
                    next[idx] = { ...next[idx]!, quantity: e.target.value, description: next[idx]!.description, price: next[idx]!.price }
                    return next
                  })}
                  placeholder="Qté"
                  className="w-14 rounded-input border border-border bg-white px-2 py-2 text-sm"
                />
                <input
                  type="text"
                  value={item.price}
                  onChange={(e) => setLineItems((prev) => {
                    const next = [...prev]
                    next[idx] = { ...next[idx]!, price: e.target.value, description: next[idx]!.description, quantity: next[idx]!.quantity }
                    return next
                  })}
                  placeholder="Prix"
                  className="w-20 rounded-input border border-border bg-white px-2 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-muted hover:text-ink p-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
