import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from './AuthContext'
import type { Workspace, Channel, DirectMessage, Message } from '@/types'

interface WorkspaceContextValue {
  workspace: Workspace | null
  channels: Channel[]
  dms: DirectMessage[]
  currentChannel: Channel | null
  currentDM: DirectMessage | null
  threadMessage: Message | null
  unreadCounts: Record<string, number>
  setCurrentChannel: (channel: Channel | null) => void
  setCurrentDM: (dm: DirectMessage | null) => void
  setThreadMessage: (message: Message | null) => void
  createChannel: (name: string, description: string, isPrivate: boolean) => Promise<Channel>
  joinChannel: (channelId: string) => Promise<void>
  createOrOpenDM: (userId: string) => Promise<DirectMessage>
  createWorkspace: (name: string, slug: string) => Promise<Workspace>
  markChannelRead: (channelId: string) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const DEMO_WORKSPACE_ID = 'demo-workspace'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [dms, setDms] = useState<DirectMessage[]>([])
  const [currentChannel, setCurrentChannelState] = useState<Channel | null>(null)
  const [currentDM, setCurrentDMState] = useState<DirectMessage | null>(null)
  const [threadMessage, setThreadMessage] = useState<Message | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Bootstrap workspace
  useEffect(() => {
    if (!user) return

    const bootstrapWorkspace = async () => {
      const wsRef = doc(db, 'workspaces', DEMO_WORKSPACE_ID)
      const wsSnap = await getDoc(wsRef)

      if (!wsSnap.exists()) {
        await setDoc(wsRef, {
          name: 'My Workspace',
          slug: 'my-workspace',
          iconURL: null,
          ownerId: user.uid,
          members: [user.uid],
          createdAt: serverTimestamp(),
        })
        // Create default channels
        await createDefaultChannels(DEMO_WORKSPACE_ID, user.uid)
      } else {
        // Add user to workspace if not already a member
        await updateDoc(wsRef, { members: arrayUnion(user.uid) })
      }

      const ws = await getDoc(wsRef)
      setWorkspace({ id: DEMO_WORKSPACE_ID, ...ws.data() } as Workspace)
    }

    bootstrapWorkspace()
  }, [user])

  // Subscribe to channels
  useEffect(() => {
    if (!user || !workspace) return

    const q = query(
      collection(db, 'channels'),
      where('workspaceId', '==', workspace.id),
      where('isArchived', '==', false),
      orderBy('createdAt', 'asc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const channelList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Channel))
      setChannels(channelList)

      // Auto-join public channels
      channelList.forEach(async (ch) => {
        if (!ch.isPrivate && !ch.members.includes(user.uid)) {
          await updateDoc(doc(db, 'channels', ch.id), { members: arrayUnion(user.uid) })
        }
      })

      // Set default channel
      setCurrentChannelState((prev) => {
        if (prev) return channelList.find((c) => c.id === prev.id) ?? channelList[0] ?? null
        return channelList.find((c) => c.name === 'general') ?? channelList[0] ?? null
      })
    })

    return unsub
  }, [user, workspace])

  // Subscribe to DMs
  useEffect(() => {
    if (!user || !workspace) return

    const q = query(
      collection(db, 'dms'),
      where('workspaceId', '==', workspace.id),
      where('members', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setDms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DirectMessage)))
    })

    return unsub
  }, [user, workspace])

  async function createDefaultChannels(workspaceId: string, userId: string) {
    const defaults = [
      { name: 'general', description: 'General discussion for everyone', topic: 'Welcome to the workspace!' },
      { name: 'random', description: 'Non-work banter and fun stuff', topic: 'Anything goes!' },
      { name: 'announcements', description: 'Important announcements', topic: '' },
    ]

    for (const ch of defaults) {
      await addDoc(collection(db, 'channels'), {
        workspaceId,
        name: ch.name,
        description: ch.description,
        topic: ch.topic,
        isPrivate: false,
        isArchived: false,
        createdBy: userId,
        members: [userId],
        pinnedMessages: [],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
      })
    }
  }

  async function createChannel(name: string, description: string, isPrivate: boolean): Promise<Channel> {
    if (!user || !workspace) throw new Error('Not authenticated')

    const ref = await addDoc(collection(db, 'channels'), {
      workspaceId: workspace.id,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      topic: '',
      isPrivate,
      isArchived: false,
      createdBy: user.uid,
      members: [user.uid],
      pinnedMessages: [],
      createdAt: serverTimestamp(),
      lastMessageAt: null,
    })

    return { id: ref.id, workspaceId: workspace.id, name, description, topic: '', isPrivate, isArchived: false, createdBy: user.uid, members: [user.uid], pinnedMessages: [], createdAt: new Date(), lastMessageAt: null }
  }

  async function joinChannel(channelId: string) {
    if (!user) return
    await updateDoc(doc(db, 'channels', channelId), { members: arrayUnion(user.uid) })
  }

  async function createOrOpenDM(userId: string): Promise<DirectMessage> {
    if (!user || !workspace) throw new Error('Not authenticated')

    const members = [user.uid, userId].sort()
    const existing = dms.find((dm) => dm.members.sort().join(',') === members.join(','))
    if (existing) return existing

    const ref = await addDoc(collection(db, 'dms'), {
      workspaceId: workspace.id,
      members,
      createdAt: serverTimestamp(),
      lastMessageAt: null,
    })

    const dm: DirectMessage = { id: ref.id, workspaceId: workspace.id, members, createdAt: new Date(), lastMessageAt: null }
    setCurrentDMState(dm)
    return dm
  }

  async function createWorkspace(name: string, slug: string): Promise<Workspace> {
    if (!user) throw new Error('Not authenticated')

    const ref = doc(db, 'workspaces', slug)
    await setDoc(ref, {
      name,
      slug,
      iconURL: null,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    })

    return { id: slug, name, slug, iconURL: null, ownerId: user.uid, members: [user.uid], createdAt: new Date() }
  }

  function markChannelRead(channelId: string) {
    setUnreadCounts((prev) => ({ ...prev, [channelId]: 0 }))
  }

  const setCurrentChannel = useCallback((channel: Channel | null) => {
    setCurrentChannelState(channel)
    setCurrentDMState(null)
    if (channel) markChannelRead(channel.id)
  }, [])

  const setCurrentDM = useCallback((dm: DirectMessage | null) => {
    setCurrentDMState(dm)
    setCurrentChannelState(null)
  }, [])

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        channels,
        dms,
        currentChannel,
        currentDM,
        threadMessage,
        unreadCounts,
        setCurrentChannel,
        setCurrentDM,
        setThreadMessage,
        createChannel,
        joinChannel,
        createOrOpenDM,
        createWorkspace,
        markChannelRead,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
