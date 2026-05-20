import React, { useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smile,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Trash2,
  Pin,
  Bookmark,
  Share2,
  Check,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { WithUserCard } from '@/components/ui/UserCard'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import type { Message as MessageType, User, Reaction } from '@/types'
import EmojiMartPicker from '@emoji-mart/react'
import EmojiData from '@emoji-mart/data'

interface MessageProps {
  message: MessageType
  author: User | undefined
  showHeader: boolean
  onReply: (msg: MessageType) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onReact: (id: string, emoji: string) => void
  isThread?: boolean
}

export function Message({
  message,
  author,
  showHeader,
  onReply,
  onEdit,
  onDelete,
  onReact,
  isThread = false,
}: MessageProps) {
  const { user } = useAuth()
  const { setThreadMessage } = useWorkspace()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const isOwn = message.userId === user?.uid
  const createdAt = message.createdAt instanceof Date
    ? message.createdAt
    : (message.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date()

  function formatTime(date: Date) {
    return format(date, 'h:mm a')
  }

  function handleSaveEdit() {
    if (editText.trim() !== message.text) {
      onEdit(message.id, editText.trim())
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      setEditText(message.text)
      setEditing(false)
    }
  }

  const quickEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '👀']

  return (
    <div
      className={`message-row ${showHeader ? 'pt-3' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); setShowMore(false) }}
    >
      <div className="flex gap-3">
        {/* Avatar or time */}
        <div className="w-9 flex-shrink-0 flex flex-col items-center">
          {showHeader ? (
            <WithUserCard user={author}>
              <Avatar src={author?.photoURL} name={author?.displayName ?? 'User'} size="md" />
            </WithUserCard>
          ) : (
            <span
              className={`text-2xs text-gray-400 transition-opacity mt-1 ${
                showActions ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {formatTime(createdAt)}
            </span>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0">
          {showHeader && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <WithUserCard user={author}>
                <span className="font-bold text-gray-900 text-sm hover:underline cursor-pointer">
                  {author?.displayName ?? 'Unknown'}
                </span>
              </WithUserCard>
              <span className="text-xs text-gray-400 leading-none">{formatTime(createdAt)}</span>
              {message.isPinned && (
                <span className="flex items-center gap-0.5 text-2xs text-gray-400">
                  <Pin size={10} />
                  Pinned
                </span>
              )}
            </div>
          )}

          {editing ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-sm border border-brand-DEFAULT rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <span>Press Enter to save, Esc to cancel</span>
                <button onClick={handleSaveEdit} className="btn-primary py-1 px-2 text-xs ml-auto">
                  <Check size={12} /> Save
                </button>
                <button onClick={() => { setEditText(message.text); setEditing(false) }} className="btn-secondary py-1 px-2 text-xs">
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="message-content text-gray-900">
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                {message.isEdited && (
                  <span className="text-xs text-gray-400 ml-1">(edited)</span>
                )}
              </div>

              {/* Attachments */}
              {message.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((att) => (
                    <div key={att.id} className="rounded-lg overflow-hidden border border-gray-200">
                      {att.type === 'image' ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="max-w-xs max-h-64 object-cover"
                        />
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-lg">
                            📎
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-600">{att.name}</p>
                            <p className="text-xs text-gray-400">
                              {(att.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reactions */}
              {message.reactions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions.map((r: Reaction) => (
                    <motion.button
                      key={r.emoji}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onReact(message.id, r.emoji)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-all ${
                        r.userIds.includes(user?.uid ?? '')
                          ? 'bg-brand-50 border-brand-200 text-brand-DEFAULT'
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{r.emoji}</span>
                      <span className="text-xs font-semibold text-gray-600">{r.count}</span>
                    </motion.button>
                  ))}
                  <button
                    onClick={() => setShowEmojiPicker(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-gray-200 bg-gray-50 hover:border-gray-300 text-gray-500 transition-colors"
                  >
                    <Smile size={12} />
                  </button>
                </div>
              )}

              {/* Thread replies */}
              {message.replyCount > 0 && !isThread && (
                <button
                  onClick={() => setThreadMessage(message)}
                  className="flex items-center gap-2 mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <div className="flex -space-x-1">
                    {message.replyUserIds.slice(0, 3).map((id) => (
                      <div key={id} className="w-5 h-5 rounded bg-purple-200 border border-white" />
                    ))}
                  </div>
                  <span className="font-semibold">
                    {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions toolbar */}
      <AnimatePresence>
        {showActions && !editing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className="message-actions"
          >
            {/* Quick emoji reactions */}
            {quickEmojis.map((emoji) => (
              <Tooltip key={emoji} content={emoji}>
                <button
                  onClick={() => onReact(message.id, emoji)}
                  className="p-1.5 rounded hover:bg-gray-100 text-base transition-colors"
                >
                  {emoji}
                </button>
              </Tooltip>
            ))}

            <div className="w-px h-5 bg-gray-200 mx-0.5" />

            <Tooltip content="Add reaction">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Smile size={16} />
              </button>
            </Tooltip>

            {!isThread && (
              <Tooltip content="Reply in thread">
                <button
                  onClick={() => setThreadMessage(message)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <MessageSquare size={16} />
                </button>
              </Tooltip>
            )}

            <Tooltip content="Save for later">
              <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
                <Bookmark size={16} />
              </button>
            </Tooltip>

            {isOwn && (
              <>
                <Tooltip content="Edit message">
                  <button
                    onClick={() => { setEditing(true); setEditText(message.text) }}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </Tooltip>
                <Tooltip content="Delete message">
                  <button
                    onClick={() => onDelete(message.id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </Tooltip>
              </>
            )}

            <Tooltip content="More actions">
              <button
                onClick={() => setShowMore(!showMore)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute right-4 top-0 z-50 shadow-popover rounded-xl overflow-hidden">
          <EmojiMartPicker
            data={EmojiData}
            onEmojiSelect={(e: { native: string }) => {
              onReact(message.id, e.native)
              setShowEmojiPicker(false)
            }}
            onClickOutside={() => setShowEmojiPicker(false)}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
    </div>
  )
}
