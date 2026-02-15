import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadReceiptImage } from '../lib/upload'
import { runOCR } from '../lib/ocr'
import { parseReceiptText } from '../lib/parse'
import { insertDocument, upsertLineItems } from '../lib/documents'
import type { DocumentType } from '../types'

type Step = 'idle' | 'uploading' | 'ocr' | 'parsing' | 'saving' | 'done'

export default function Scan() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const list = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) return
    setFiles((prev) => [...prev, ...list])
    const urls = list.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...urls])
    setError(null)
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previews[index]!)
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }, [previews])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files
      if (selected) addFiles(selected)
      e.target.value = ''
    },
    [addFiles]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleSave = useCallback(async () => {
    if (files.length === 0) {
      setError('Ajoutez au moins une photo.')
      return
    }
    setError(null)
    const docId = crypto.randomUUID()

    try {
      setStep('uploading')
      const imageUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const url = await uploadReceiptImage(docId, files[i]!, i)
        imageUrls.push(url)
      }

      let rawOcrText = ''
      let parsed: Awaited<ReturnType<typeof parseReceiptText>> | null = null

      setStep('ocr')
      rawOcrText = await runOCR(files[0]!)

      if (rawOcrText.trim()) {
        setStep('parsing')
        try {
          parsed = await parseReceiptText(rawOcrText)
        } catch {
          parsed = null
        }
      }

      setStep('saving')
      const dateStr = parsed?.date ? (parsed.date.includes('-') ? parsed.date : null) : null
      const doc = await insertDocument({
        type: (parsed?.type as DocumentType) || 'receipt',
        merchant_name: parsed?.merchant_name ?? '',
        date: dateStr,
        total_amount: parsed?.total_amount ?? '',
        currency: parsed?.currency ?? '',
        category: parsed?.category ?? '',
        comment: '',
        warranty_enabled: parsed?.warranty_suspected ?? false,
        warranty_end_date: null,
        warranty_duration: '',
        warranty_product_description: '',
        raw_ocr_text: rawOcrText,
        image_urls: imageUrls,
      })

      if (parsed?.line_items?.length) {
        await upsertLineItems(
          doc.id,
          parsed.line_items.map((i) => ({
            description: i.description ?? '',
            quantity: i.quantity ?? '1',
            price: i.price ?? '',
          }))
        )
      }

      setStep('done')
      navigate(`/doc/${doc.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setStep('idle')
    }
  }, [files, navigate])

  const isLoading = step !== 'idle' && step !== 'done'
  const canSave = files.length > 0 && !isLoading

  return (
    <div className="mx-auto max-w-content px-4 pb-8">
      <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} className="text-ink">
          ← Annuler
        </button>
        <h1 className="text-sm font-semibold text-ink">Nouveau scan</h1>
        <span className="w-14" />
      </header>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`mt-4 rounded-card border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-ink bg-neutral-50' : 'border-border bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={onInputChange}
          className="hidden"
        />
        <p className="text-sm text-muted mb-2">Appareil photo ou bibliothèque</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-button border border-border bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            Prendre une photo
          </button>
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.multiple = true
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement
                if (target.files) addFiles(target.files)
              }
              input.click()
            }}
            className="rounded-button border border-border bg-white px-4 py-2 text-sm font-medium text-ink"
          >
            Choisir des photos
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">ou glissez-déposez des images ici</p>
      </div>

      {previews.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted">{previews.length} image(s)</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {previews.map((url, i) => (
              <div key={url} className="relative shrink-0">
                <img
                  src={url}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {isLoading && (
        <p className="mt-4 text-center text-sm text-muted">
          {step === 'uploading' && 'Envoi des images…'}
          {step === 'ocr' && 'Extraction du texte…'}
          {step === 'parsing' && 'Analyse…'}
          {step === 'saving' && 'Enregistrement…'}
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full rounded-button bg-ink py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          Extraire et enregistrer
        </button>
      </div>
    </div>
  )
}
