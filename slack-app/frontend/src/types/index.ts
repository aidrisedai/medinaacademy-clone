export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  status: UserStatus
  statusEmoji?: string
  statusText?: string
  createdAt: Date
  lastSeen: Date
}

export type UserStatus = 'online' | 'away' | 'dnd' | 'offline'

export interface Workspace {
  id: string
  name: string
  slug: string
  iconURL: string | null
  ownerId: string
  members: string[]
  createdAt: Date
}

export interface Channel {
  id: string
  workspaceId: string
  name: string
  description: string
  topic: string
  isPrivate: boolean
  isArchived: boolean
  createdBy: string
  members: string[]
  pinnedMessages: string[]
  createdAt: Date
  lastMessageAt: Date | null
}

export interface Message {
  id: string
  channelId: string
  workspaceId: string
  userId: string
  text: string
  html?: string
  attachments: Attachment[]
  reactions: Reaction[]
  replyCount: number
  replyUserIds: string[]
  threadId: string | null
  parentId: string | null
  isEdited: boolean
  editedAt: Date | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Attachment {
  id: string
  type: 'image' | 'file' | 'video' | 'audio' | 'link'
  name: string
  url: string
  size: number
  mimeType: string
  thumbnailURL?: string
  width?: number
  height?: number
}

export interface Reaction {
  emoji: string
  count: number
  userIds: string[]
}

export interface DirectMessage {
  id: string
  workspaceId: string
  members: string[]
  createdAt: Date
  lastMessageAt: Date | null
}

export interface TypingIndicator {
  userId: string
  channelId: string
  timestamp: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'mention' | 'reply' | 'reaction' | 'channel_invite'
  messageId: string
  channelId: string
  actorId: string
  read: boolean
  createdAt: Date
}

export interface SearchResult {
  type: 'message' | 'channel' | 'user'
  id: string
  highlight: string
  channelId?: string
  userId?: string
}

export type PanelView = 'channel' | 'dm' | 'thread' | 'search' | 'profile'

export interface AppState {
  currentWorkspace: Workspace | null
  currentChannel: Channel | null
  currentDM: DirectMessage | null
  threadMessage: Message | null
  panel: PanelView
  sidebarOpen: boolean
}
