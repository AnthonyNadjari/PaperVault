import type { ReactNode } from 'react'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config'

const configured =
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_URL.includes('TON_PROJECT') &&
  !SUPABASE_ANON_KEY.includes('ta_cle')

export function SupabaseGuard({ children }: { children: ReactNode }) {
  if (!configured) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-12">
        <h1 className="text-lg font-semibold text-ink mb-2">PaperVault</h1>
        <p className="text-sm text-muted text-center max-w-sm">
          Remplace <code className="bg-neutral-100 px-1 rounded">SUPABASE_URL</code> et <code className="bg-neutral-100 px-1 rounded">SUPABASE_ANON_KEY</code> dans <code className="bg-neutral-100 px-1 rounded">src/config.ts</code> par tes vrais identifiants (Supabase → Settings → API).
        </p>
      </div>
    )
  }
  return <>{children}</>
}
