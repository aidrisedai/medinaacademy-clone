import React from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Avatar } from '@/components/ui/Avatar'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useMessages } from '@/hooks/useMessages'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'

export function DMView() {
  const { currentDM } = useWorkspace()
  const { user } = useAuth()
  const { users } = useWorkspaceUsers()
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
    uploadFile,
    setTyping,
  } = useMessages(currentDM?.id ?? null, { isDM: true })

  if (!currentDM) return null

  const otherId = currentDM.members.find((id) => id !== user?.uid)
  const otherUser = otherId ? users[otherId] : null

  const emptyState = (
    <div className="text-center py-12 px-8 max-w-md">
      {otherUser && (
        <Avatar
          src={otherUser.photoURL}
          name={otherUser.displayName}
          size="xl"
          className="mx-auto mb-4"
        />
      )}
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        {otherUser?.displayName ?? 'Direct Message'}
      </h2>
      <p className="text-gray-500 text-sm">
        This is the very beginning of your direct message history with{' '}
        <span className="font-semibold">{otherUser?.displayName ?? 'this person'}</span>.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
        {otherUser && (
          <Avatar
            src={otherUser.photoURL}
            name={otherUser.displayName}
            size="sm"
            status={otherUser.status}
          />
        )}
        <div>
          <h2 className="font-bold text-gray-900 text-sm">
            {otherUser?.displayName ?? 'Direct Message'}
          </h2>
          {otherUser?.status && (
            <p className="text-xs text-gray-400 capitalize">{otherUser.status}</p>
          )}
        </div>
      </div>

      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        typingUsers={typingUsers}
        onLoadMore={loadMore}
        onReply={() => {}}
        onEdit={editMessage}
        onDelete={deleteMessage}
        onReact={toggleReaction}
        emptyState={emptyState}
      />

      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <MessageInput
          placeholder={`Message ${otherUser?.displayName ?? ''}`}
          onSend={(text, attachments) => sendMessage(text, attachments)}
          onTyping={setTyping}
          onUpload={uploadFile}
        />
      </div>
    </div>
  )
}
