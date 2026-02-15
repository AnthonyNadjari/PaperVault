import type { ReactNode } from 'react'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = Boolean(url && anonKey && url.startsWith('http'))

export function SupabaseGuard({ children }: { children: ReactNode }) {
  if (!configured) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-12">
        <h1 className="text-lg font-semibold text-ink mb-2">PaperVault</h1>
        <p className="text-sm text-muted text-center max-w-sm">
          Configure Supabase pour utiliser l’app. Ajoute les secrets <code className="bg-neutral-100 px-1 rounded">VITE_SUPABASE_URL</code> et <code className="bg-neutral-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> dans GitHub (Settings → Secrets and variables → Actions), puis relance le déploiement.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
