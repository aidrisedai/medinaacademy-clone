import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let _addToast: ((toast: Omit<Toast, 'id'>) => void) | null = null

// Singleton so it can be called outside React components too
export function registerToastFn(fn: typeof _addToast) {
  _addToast = fn
}

export function toast(message: string, type: ToastType = 'info', duration = 3500) {
  _addToast?.({ message, type, duration })
}

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, t.duration ?? 3500)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
