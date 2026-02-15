import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PaperVault error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-surface px-6 py-12">
          <h1 className="text-lg font-semibold text-ink mb-2">Erreur</h1>
          <p className="text-sm text-muted text-center max-w-sm">
            Une erreur s’est produite. Recharge la page ou vérifie la console.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
