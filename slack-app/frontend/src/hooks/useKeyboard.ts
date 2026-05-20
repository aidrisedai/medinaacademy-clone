import { useEffect } from 'react'

type Handler = (e: KeyboardEvent) => void

interface ShortcutMap {
  [key: string]: Handler
}

export function useKeyboard(shortcuts: ShortcutMap, active = true) {
  useEffect(() => {
    if (!active) return

    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      const combo = [
        meta ? 'mod' : null,
        e.shiftKey ? 'shift' : null,
        e.altKey ? 'alt' : null,
        key,
      ]
        .filter(Boolean)
        .join('+')

      shortcuts[combo]?.(e)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts, active])
}
