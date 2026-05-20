import React from 'react'
import { motion } from 'framer-motion'
import { X, Hash } from 'lucide-react'
import { Message } from './Message'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useMessages, useThreadMessages } from '@/hooks/useMessages'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import type { Message as MessageType } from '@/types'

export function ThreadPanel() {
  const { threadMessage, setThreadMessage, currentChannel } = useWorkspace()
  const { users } = useWorkspaceUsers()
  const { sendMessage, editMessage, deleteMessage, toggleReaction } = useMessages(currentChannel?.id ?? null)
  const { replies, loading } = useThreadMessages(threadMessage?.id ?? null)

  if (!threadMessage) return null

  const handleSendReply = async (text: string) => {
    await sendMessage(text, [], threadMessage.id)
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="flex flex-col h-full border-l border-gray-200 bg-white w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div>
          <h2 className="font-bold text-gray-900">Thread</h2>
          {currentChannel && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Hash size={11} />
              {currentChannel.name}
            </p>
          )}
        </div>
        <button
          onClick={() => setThreadMessage(null)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Parent message */}
      <div className="border-b border-gray-200 bg-gray-50">
        <Message
          message={threadMessage}
          author={users[threadMessage.userId]}
          showHeader={true}
          onReply={() => {}}
          onEdit={editMessage}
          onDelete={deleteMessage}
          onReact={toggleReaction}
          isThread={true}
        />
      </div>

      {/* Replies count */}
      {replies.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

      {/* Thread replies */}
      <MessageList
        messages={replies}
        loading={loading}
        hasMore={false}
        typingUsers={[]}
        onLoadMore={() => {}}
        onReply={() => {}}
        onEdit={editMessage}
        onDelete={deleteMessage}
        onReact={toggleReaction}
        isThread={true}
        emptyState={
          <div className="text-center text-gray-400 py-8">
            <MessageInput placeholder="" onSend={() => {}} />
            <p className="text-sm mt-2">No replies yet</p>
            <p className="text-xs">Be the first to reply</p>
          </div>
        }
      />

      {/* Reply input */}
      <div className="p-4 flex-shrink-0">
        <MessageInput
          placeholder={`Reply to thread...`}
          onSend={handleSendReply}
          autoFocus
        />
      </div>
    </motion.div>
  )
}
