import React from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-screen">
          <div className="text-center max-w-sm px-6">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-1 font-mono bg-gray-100 px-3 py-2 rounded-lg text-left break-all">
              {this.state.error.message}
            </p>
            <p className="text-xs text-gray-400 mb-6 mt-3">
              This is usually caused by a configuration issue. Check your Firebase credentials in{' '}
              <code className="font-mono">.env</code>.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mx-auto"
            >
              <RefreshCw size={14} />
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
