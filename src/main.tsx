import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SupabaseGuard } from './components/SupabaseGuard'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/PaperVault">
        <SupabaseGuard>
          <App />
        </SupabaseGuard>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
