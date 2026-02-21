// Supabase Edge Function: parse raw OCR text into structured JSON (OpenAI).
// Set OPENAI_API_KEY in Supabase Dashboard > Edge Functions > Secrets.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const EXTRACT_SYSTEM = `You are an expert receipt and invoice parser. Extract structured data from OCR text with high accuracy.

RULES:
- Return ONLY valid JSON. No markdown, no explanation, no code fence.
- merchant_name: Store/shop name (e.g. SOEUR, Amazon). Usually at the top or after an address.
- date: Use YYYY-MM-DD. Accept DD/MM/YY, DD/MM/YYYY, "14/02/26", "14 Feb 2026", etc.
- total_amount: The final total paid, digits only (e.g. "185.00" for £185.00). Prefer "Total Amount (Tax Included)", "Amount Paid", "Total", "***** £185.00 ****".
- currency: From symbol or text: £ or GBP, € or EUR, $ or USD. One of: GBP, EUR, USD, or empty.
- line_items: Every product line. description = product name (e.g. "FLAVIE 36 CHOCOLAT"), quantity = number (e.g. "1"), price = unit or line price (e.g. "100.00" or "85.00"). If you see "Designation" or "Item" or product names with prices, extract them.
- category: One of: Electronics, Home, Food, Health, Transport, Clothing, Other. Clothing for fashion/stores, Food for groceries/restaurants.
- warranty_suspected: true only for electronics, appliances, or items over ~500.
- type: "receipt" for shop receipts, "invoice" for formal invoices, "warranty" only if it's a warranty document.`

const EXTRACT_USER = (raw: string) => `Extract from this receipt/invoice OCR text. Return only a single JSON object, no other text.

Required JSON shape (use empty string "" or [] when not found):
{"type":"receipt","merchant_name":"","date":"","total_amount":"","currency":"","category":"","warranty_suspected":false,"line_items":[{"description":"","quantity":"","price":""}]}

OCR text:
${raw}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  let body: { raw_ocr_text?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const raw = body.raw_ocr_text ?? ''
  if (!raw.trim()) {
    return new Response(JSON.stringify({ error: 'raw_ocr_text required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACT_SYSTEM },
        { role: 'user', content: EXTRACT_USER(raw) },
      ],
      temperature: 0,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: 'OpenAI error', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content?.trim() ?? ''
  let parsed: unknown
  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON from model', raw: content }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify(parsed), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
