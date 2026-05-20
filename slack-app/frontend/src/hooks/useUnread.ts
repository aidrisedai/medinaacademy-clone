import { useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { Channel } from '@/types'

/**
 * Subscribes to the latest message timestamp on every channel the user is in.
 * Calls onUnread(channelId) whenever a new message arrives in a channel
 * the user is not currently viewing.
 */
export function useUnread(
  channels: Channel[],
  currentChannelId: string | null,
  onUnread: (channelId: string) => void
) {
  const mountedRef = useRef(false)
  const currentRef = useRef(currentChannelId)

  // Keep currentRef in sync without re-subscribing
  useEffect(() => {
    currentRef.current = currentChannelId
  }, [currentChannelId])

  useEffect(() => {
    if (channels.length === 0) return

    // Give the initial snapshot a tick to settle before counting as "new"
    const ready = { flag: false }
    const timer = setTimeout(() => { ready.flag = true }, 1500)

    const unsubs = channels.map((ch) => {
      const q = query(
        collection(db, 'messages'),
        where('channelId', '==', ch.id),
        where('parentId', '==', null),
        orderBy('createdAt', 'desc'),
        limit(1)
      )

      let firstSnapshot = true

      return onSnapshot(q, (snap) => {
        if (firstSnapshot) { firstSnapshot = false; return }
        if (!ready.flag) return
        if (snap.empty) return
        if (currentRef.current !== ch.id) {
          onUnread(ch.id)
        }
      })
    })

    return () => {
      clearTimeout(timer)
      unsubs.forEach((u) => u())
    }
  }, [channels, onUnread])
}
