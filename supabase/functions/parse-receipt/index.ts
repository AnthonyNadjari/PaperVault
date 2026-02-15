// Supabase Edge Function: parse raw OCR text into structured JSON (OpenAI).
// Set OPENAI_API_KEY in Supabase Dashboard > Edge Functions > Secrets.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const EXTRACT_SYSTEM = `You are a receipt/invoice parser. Given raw OCR text, extract structured data.
Return ONLY valid JSON, no markdown, no explanation.
If a value is uncertain or missing, use empty string "" or false.
For date use YYYY-MM-DD when possible.
For total_amount use the final total (after tax) as string with digits and optional decimal.
For line_items extract item description, quantity, price when visible.
Suggest category from: Electronics, Home, Food, Health, Transport, Clothing, Other.
Set warranty_suspected true only for electronics, appliances, high-value items.`

const EXTRACT_USER = (raw: string) => `Parse this OCR text into the exact JSON shape below. Return nothing else.

\`\`\`json
{
  "type": "",
  "merchant_name": "",
  "date": "",
  "total_amount": "",
  "currency": "",
  "category": "",
  "warranty_suspected": false,
  "line_items": [
    { "description": "", "quantity": "", "price": "" }
  ]
}
\`\`\`

OCR text:
${raw}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  }
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
  let body: { raw_ocr_text?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const raw = body.raw_ocr_text ?? ''
  if (!raw.trim()) {
    return new Response(JSON.stringify({ error: 'raw_ocr_text required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
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
      temperature: 0.1,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: 'OpenAI error', detail: err }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content?.trim() ?? ''
  let parsed: unknown
  try {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON from model', raw: content }), { status: 502, headers: { 'Content-Type': 'application/json' } })
  }
  return new Response(JSON.stringify(parsed), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
})
