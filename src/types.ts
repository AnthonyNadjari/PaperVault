export type DocumentType = 'receipt' | 'invoice' | 'warranty' | 'other'

export interface LineItem {
  id?: string
  document_id?: string
  description: string
  quantity: string
  price: string
  position?: number
}

export interface Document {
  id: string
  type: DocumentType
  merchant_name: string
  date: string | null
  total_amount: string
  currency: string
  category: string
  comment: string
  warranty_enabled: boolean
  warranty_end_date: string | null
  warranty_duration: string
  warranty_product_description: string
  raw_ocr_text: string
  image_urls: string[]
  created_at: string
  updated_at: string
}

export interface ParsedReceipt {
  type: string
  merchant_name: string
  date: string
  total_amount: string
  currency: string
  category: string
  warranty_suspected: boolean
  line_items: { description: string; quantity: string; price: string }[]
}

export const CATEGORIES = [
  'Electronics',
  'Home',
  'Food',
  'Health',
  'Transport',
  'Clothing',
  'Other',
] as const
