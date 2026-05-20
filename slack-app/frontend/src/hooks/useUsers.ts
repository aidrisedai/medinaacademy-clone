import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import type { User } from '@/types'

export function useWorkspaceUsers() {
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const map: Record<string, User> = {}
      snap.docs.forEach((d) => {
        map[d.id] = { uid: d.id, ...d.data() } as User
      })
      setUsers(map)
      setLoading(false)
    })
    return unsub
  }, [])

  return { users, loading }
}

export function useUser(uid: string | null) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!uid) return
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) setUser({ uid: snap.id, ...snap.data() } as User)
    })
  }, [uid])

  return user
}
