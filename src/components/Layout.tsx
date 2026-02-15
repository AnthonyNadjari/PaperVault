import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { path: '/', label: 'Archive' },
  { path: '/photos', label: 'Photos' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isArchive = location.pathname === '/'
  const isPhotos = location.pathname === '/photos'
  const showTabs = isArchive || isPhotos

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {showTabs && (
        <nav
          className="flex border-t border-border bg-white pb-safe"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {tabs.map(({ path, label }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  active ? 'text-ink' : 'text-muted'
                }`}
              >
                {label}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
