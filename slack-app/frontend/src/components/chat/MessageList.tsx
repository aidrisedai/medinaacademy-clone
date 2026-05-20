import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { ArrowDown } from 'lucide-react'
import { Message } from './Message'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import type { Message as MessageType } from '@/types'

interface MessageListProps {
  messages: MessageType[]
  loading: boolean
  hasMore: boolean
  typingUsers: string[]
  onLoadMore: () => void
  onReply: (msg: MessageType) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  onReact: (id: string, emoji: string) => void
  isThread?: boolean
  emptyState?: React.ReactNode
}

function DateDivider({ date }: { date: Date }) {
  let label: string
  if (isToday(date)) label = 'Today'
  else if (isYesterday(date)) label = 'Yesterday'
  else label = format(date, 'EEEE, MMMM d')

  return (
    <div className="flex items-center gap-3 px-4 py-2 my-1">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function SkeletonMessage() {
  return (
    <div className="flex gap-3 px-4 py-2">
      <div className="skeleton w-9 h-9 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2 items-center">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-14 rounded" />
        </div>
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3.5 w-1/2 rounded" />
      </div>
    </div>
  )
}

function TypingIndicator({
  userIds,
  users,
}: {
  userIds: string[]
  users: Record<string, { displayName: string }>
}) {
  if (userIds.length === 0) return null

  const names = userIds.map((id) => users[id]?.displayName ?? 'Someone').slice(0, 3)
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]}, ${names[1]}, and others are typing`

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-center gap-2 px-4 py-1.5"
    >
      <div className="flex gap-0.5 items-end">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 italic">{label}…</span>
    </motion.div>
  )
}

export function MessageList({
  messages,
  loading,
  hasMore,
  typingUsers,
  onLoadMore,
  onReply,
  onEdit,
  onDelete,
  onReact,
  isThread = false,
  emptyState,
}: MessageListProps) {
  const { users } = useWorkspaceUsers()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const isAtBottomRef = useRef(true)

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distFromBottom < 120
    setShowJumpToLatest(distFromBottom > 400)

    // Load more when scrolled to the very top
    if (el.scrollTop < 80 && hasMore && !loading) onLoadMore()
  }, [hasMore, loading, onLoadMore])

  // Scroll to bottom on new messages only if already near bottom
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      if (isAtBottomRef.current || messages.length === 1) {
        bottomRef.current?.scrollIntoView({ behavior: prevCountRef.current === 0 ? 'instant' : 'smooth' })
      }
    }
    prevCountRef.current = messages.length
  }, [messages.length])

  // Scroll to bottom when channel changes (initial load)
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView()
        isAtBottomRef.current = true
        setShowJumpToLatest(false)
      }, 80)
    }
  }, [loading])

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowJumpToLatest(false)
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonMessage key={i} />
        ))}
      </div>
    )
  }

  if (messages.length === 0 && emptyState) {
    return <div className="flex-1 flex items-center justify-center">{emptyState}</div>
  }

  // Group messages: show header when author/time changes or day changes
  const grouped = messages.map((msg, i) => {
    const prev = messages[i - 1]
    const prevDate = prev
      ? ((prev.createdAt instanceof Date ? prev.createdAt : (prev.createdAt as any)?.toDate?.()) ?? null)
      : null
    const currDate =
      msg.createdAt instanceof Date ? msg.createdAt : (msg.createdAt as any)?.toDate?.() ?? new Date()

    const showDateDivider = !prev || !isSameDay(currDate, prevDate ?? new Date(0))
    const showHeader =
      showDateDivider ||
      msg.userId !== prev?.userId ||
      (prevDate && currDate.getTime() - prevDate.getTime() > 5 * 60 * 1000)

    return { msg, currDate, showDateDivider, showHeader }
  })

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        {hasMore && (
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium px-3 py-1 bg-blue-50 rounded-full"
            >
              Load earlier messages
            </button>
          </div>
        )}

        <div className="pb-2">
          {grouped.map(({ msg, currDate, showDateDivider, showHeader }) => (
            <React.Fragment key={msg.id}>
              {showDateDivider && <DateDivider date={currDate} />}
              <Message
                message={msg}
                author={users[msg.userId]}
                showHeader={showHeader}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                isThread={isThread}
              />
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence>
          {typingUsers.length > 0 && (
            <TypingIndicator userIds={typingUsers} users={users} />
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Jump to latest button */}
      <AnimatePresence>
        {showJumpToLatest && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-brand-DEFAULT text-white text-xs font-semibold rounded-full shadow-lg hover:bg-brand-700 transition-colors"
          >
            <ArrowDown size={13} />
            Jump to latest
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
