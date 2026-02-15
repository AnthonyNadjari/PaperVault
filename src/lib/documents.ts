import { supabase } from './supabase'
import type { Document, LineItem } from '../types'

export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('date', { ascending: false, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Document[]
}

export async function searchDocuments(q: string): Promise<Document[]> {
  const trimmed = q.trim()
  if (!trimmed) return getDocuments()

  const { data: bySearch, error: searchError } = await supabase
    .from('documents')
    .select('*')
    .textSearch('search_vector', trimmed, { type: 'websearch', config: 'simple' })
    .order('date', { ascending: false, nullsFirst: false })

  if (!searchError && bySearch?.length) {
    return bySearch as Document[]
  }

  const { data: byLineItems } = await supabase
    .from('line_items')
    .select('document_id')
    .ilike('description', `%${trimmed}%`)

  const docIds = [...new Set((byLineItems ?? []).map((r) => r.document_id))]
  if (docIds.length === 0) {
    const { data: byFields, error: fieldsError } = await supabase
      .from('documents')
      .select('*')
      .or(`merchant_name.ilike.%${trimmed}%,comment.ilike.%${trimmed}%,total_amount.ilike.%${trimmed}%,category.ilike.%${trimmed}%,raw_ocr_text.ilike.%${trimmed}%`)
      .order('date', { ascending: false, nullsFirst: false })
    if (!fieldsError && byFields?.length) return byFields as Document[]
    return []
  }

  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('*')
    .in('id', docIds)
    .order('date', { ascending: false, nullsFirst: false })
  if (docsError) return []
  return (docs ?? []) as Document[]
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()
  if (error || !data) return null
  return data as Document
}

export async function getLineItems(documentId: string): Promise<LineItem[]> {
  const { data, error } = await supabase
    .from('line_items')
    .select('*')
    .eq('document_id', documentId)
    .order('position', { ascending: true })
  if (error) return []
  return (data ?? []) as LineItem[]
}

export async function upsertDocument(doc: Partial<Document>): Promise<Document> {
  const payload = {
    ...doc,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('documents').upsert(payload).select().single()
  if (error) throw error
  return data as Document
}

export async function insertDocument(doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> {
  const { data, error } = await supabase.from('documents').insert(doc).select().single()
  if (error) throw error
  return data as Document
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Document
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

export async function upsertLineItems(documentId: string, items: { description: string; quantity: string; price: string }[]): Promise<void> {
  await supabase.from('line_items').delete().eq('document_id', documentId)
  if (items.length === 0) return
  const rows = items.map((item, position) => ({
    document_id: documentId,
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    position,
  }))
  const { error } = await supabase.from('line_items').insert(rows)
  if (error) throw error
}
