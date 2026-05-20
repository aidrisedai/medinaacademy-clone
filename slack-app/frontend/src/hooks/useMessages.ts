import { useEffect, useState, useCallback, useRef } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  startAfter,
  getDocs,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Message, Reaction, Attachment } from '@/types'

const PAGE_SIZE = 50

export function useMessages(channelId: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    setMessages([])

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      where('parentId', '==', null),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    )

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Message))
        .reverse()

      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null
      setHasMore(snap.docs.length === PAGE_SIZE)
      setMessages(msgs)
      setLoading(false)
    })

    return unsub
  }, [channelId])

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channelId) return

    const q = query(collection(db, 'typing'), where('channelId', '==', channelId))
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now()
      const active = snap.docs
        .filter((d) => {
          const ts = d.data().timestamp?.toMillis?.() ?? 0
          return now - ts < 5000 && d.id !== user?.uid
        })
        .map((d) => d.data().userId as string)
      setTypingUsers(active)
    })

    return unsub
  }, [channelId, user])

  const loadMore = useCallback(async () => {
    if (!channelId || !lastDocRef.current) return

    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      where('parentId', '==', null),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      limit(PAGE_SIZE)
    )

    const snap = await getDocs(q)
    const older = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)).reverse()
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null
    setHasMore(snap.docs.length === PAGE_SIZE)
    setMessages((prev) => [...older, ...prev])
  }, [channelId])

  const sendMessage = useCallback(
    async (text: string, attachments: Attachment[] = [], parentId: string | null = null) => {
      if (!user || !channelId) return

      await addDoc(collection(db, 'messages'), {
        channelId,
        workspaceId: 'demo-workspace',
        userId: user.uid,
        text,
        attachments,
        reactions: [],
        replyCount: 0,
        replyUserIds: [],
        threadId: parentId,
        parentId,
        isEdited: false,
        editedAt: null,
        isPinned: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      if (parentId) {
        await updateDoc(doc(db, 'messages', parentId), {
          replyCount: (await getDocs(
            query(collection(db, 'messages'), where('parentId', '==', parentId))
          )).size + 1,
          replyUserIds: arrayUnion(user.uid),
          updatedAt: serverTimestamp(),
        })
      }

      // Update channel's last message time
      await updateDoc(doc(db, 'channels', channelId), { lastMessageAt: serverTimestamp() })
    },
    [user, channelId]
  )

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    await updateDoc(doc(db, 'messages', messageId), {
      text: newText,
      isEdited: true,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    await deleteDoc(doc(db, 'messages', messageId))
  }, [])

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return

      const msgRef = doc(db, 'messages', messageId)
      const msgSnap = await getDocs(query(collection(db, 'messages'), where('__name__', '==', messageId)))
      if (msgSnap.empty) return

      const msg = msgSnap.docs[0].data() as Message
      const existing = msg.reactions?.find((r: Reaction) => r.emoji === emoji)

      if (existing) {
        if (existing.userIds.includes(user.uid)) {
          const updated = existing.userIds.filter((id: string) => id !== user.uid)
          if (updated.length === 0) {
            await updateDoc(msgRef, {
              reactions: msg.reactions.filter((r: Reaction) => r.emoji !== emoji),
            })
          } else {
            await updateDoc(msgRef, {
              reactions: msg.reactions.map((r: Reaction) =>
                r.emoji === emoji ? { ...r, count: updated.length, userIds: updated } : r
              ),
            })
          }
        } else {
          await updateDoc(msgRef, {
            reactions: msg.reactions.map((r: Reaction) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, userIds: [...r.userIds, user.uid] }
                : r
            ),
          })
        }
      } else {
        await updateDoc(msgRef, {
          reactions: arrayUnion({ emoji, count: 1, userIds: [user.uid] }),
        })
      }
    },
    [user]
  )

  const uploadFile = useCallback(
    async (file: File): Promise<Attachment> => {
      if (!user) throw new Error('Not authenticated')

      const path = `attachments/${user.uid}/${Date.now()}_${file.name}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      const attachment: Attachment = {
        id: crypto.randomUUID(),
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: file.name,
        url,
        size: file.size,
        mimeType: file.type,
      }

      return attachment
    },
    [user]
  )

  const setTyping = useCallback(async () => {
    if (!user || !channelId) return

    await updateDoc(doc(db, 'typing', user.uid), {
      userId: user.uid,
      channelId,
      timestamp: serverTimestamp(),
    }).catch(() =>
      addDoc(collection(db, 'typing'), {
        userId: user.uid,
        channelId,
        timestamp: serverTimestamp(),
      })
    )

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(async () => {
      await updateDoc(doc(db, 'typing', user.uid), {
        timestamp: new Date(0),
      }).catch(() => {})
    }, 4000)
  }, [user, channelId])

  return {
    messages,
    loading,
    hasMore,
    typingUsers,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    uploadFile,
    setTyping,
  }
}

export function useThreadMessages(parentId: string | null) {
  const [replies, setReplies] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!parentId) {
      setReplies([])
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'messages'),
      where('parentId', '==', parentId),
      orderBy('createdAt', 'asc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)))
      setLoading(false)
    })

    return unsub
  }, [parentId])

  return { replies, loading }
}
