import { supabase } from './supabase'
import type { ParsedReceipt } from '../types'

export async function parseReceiptText(rawOcrText: string): Promise<ParsedReceipt> {
  const { data, error } = await supabase.functions.invoke<unknown>('parse-receipt', {
    body: { raw_ocr_text: rawOcrText },
  })
  if (error) throw error
  if (!data || typeof data !== 'object') throw new Error('Invalid response from parser')
  return data as ParsedReceipt
}
