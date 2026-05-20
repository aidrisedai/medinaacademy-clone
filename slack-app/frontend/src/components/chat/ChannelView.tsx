import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash,
  Lock,
  Bell,
  Users,
  Pin,
  Settings,
  ChevronDown,
  Info,
  MessageSquare,
  Search,
} from 'lucide-react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ThreadPanel } from './Thread'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useMessages } from '@/hooks/useMessages'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import type { Message } from '@/types'

export function ChannelView() {
  const { currentChannel, threadMessage, setThreadMessage } = useWorkspace()
  const {
    messages,
    loading,
    hasMore,
    typingUsers,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    setTyping,
  } = useMessages(currentChannel?.id ?? null)
  const { users } = useWorkspaceUsers()
  const [showMembers, setShowMembers] = useState(false)

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No channel selected</h2>
          <p className="text-gray-400 text-sm">Choose a channel from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  const memberCount = currentChannel.members.length

  const emptyState = (
    <div className="text-center py-12 px-8 max-w-md">
      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {currentChannel.isPrivate ? (
          <Lock size={24} className="text-brand-DEFAULT" />
        ) : (
          <Hash size={24} className="text-brand-DEFAULT" />
        )}
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Welcome to #{currentChannel.name}!
      </h2>
      <p className="text-gray-500 text-sm">
        {currentChannel.description || `This is the very beginning of the #${currentChannel.name} channel.`}
      </p>
      <p className="text-gray-400 text-xs mt-3">Start a conversation below.</p>
    </div>
  )

  return (
    <div className="flex flex-1 min-w-0 h-full overflow-hidden">
      {/* Main channel area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Channel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <button className="flex items-center gap-1.5 hover:bg-gray-100 rounded-lg px-2 py-1 -ml-2 transition-colors group">
              {currentChannel.isPrivate ? (
                <Lock size={16} className="text-gray-500" />
              ) : (
                <Hash size={16} className="text-gray-500" />
              )}
              <span className="font-bold text-gray-900">{currentChannel.name}</span>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600" />
            </button>
            {currentChannel.topic && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                <span className="text-sm text-gray-500 truncate max-w-xs">{currentChannel.topic}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showMembers ? 'bg-brand-50 text-brand-DEFAULT' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Users size={15} />
              <span>{memberCount}</span>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
              <Search size={16} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
              <Bell size={16} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
              <Pin size={16} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          typingUsers={typingUsers}
          onLoadMore={loadMore}
          onReply={setThreadMessage}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReact={toggleReaction}
          emptyState={emptyState}
        />

        {/* Input */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <MessageInput
            placeholder={`Message #${currentChannel.name}`}
            onSend={(text, attachments) => sendMessage(text, attachments)}
            onTyping={setTyping}
          />
        </div>
      </div>

      {/* Members panel */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-gray-200 bg-white overflow-hidden flex-shrink-0"
          >
            <MembersPanel channel={currentChannel} users={users} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thread panel */}
      <AnimatePresence>
        {threadMessage && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-shrink-0"
          >
            <ThreadPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MembersPanel({
  channel,
  users,
}: {
  channel: { members: string[]; name: string }
  users: Record<string, { uid: string; displayName: string; photoURL: string | null; status: string }>
}) {
  const members = channel.members.map((id) => users[id]).filter(Boolean)
  const online = members.filter((u) => u.status === 'online' || u.status === 'away')
  const offline = members.filter((u) => u.status === 'offline' || !u.status)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm">Members</h3>
        <p className="text-xs text-gray-500">{members.length} members</p>
      </div>
      <div className="p-2">
        {online.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
              Online — {online.length}
            </p>
            {online.map((u) => (
              <MemberItem key={u.uid} user={u} />
            ))}
          </>
        )}
        {offline.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1 mt-2">
              Offline — {offline.length}
            </p>
            {offline.map((u) => (
              <MemberItem key={u.uid} user={u} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function MemberItem({ user }: { user: { displayName: string; photoURL: string | null; status: string } }) {
  const statusColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-400',
    dnd: 'bg-red-500',
    offline: 'bg-gray-300',
  }[user.status] ?? 'bg-gray-300'

  return (
    <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
      <div className="relative">
        <div className="w-7 h-7 rounded-md bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user.displayName[0]?.toUpperCase()}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusColor} border border-white`} />
      </div>
      <span className="text-sm text-gray-700 truncate">{user.displayName}</span>
    </button>
  )
}
