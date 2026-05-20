import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare } from 'lucide-react'
import { Avatar } from './Avatar'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import type { User } from '@/types'

interface UserCardProps {
  user: User
  anchorRef: React.RefObject<HTMLElement>
  onClose: () => void
}

const statusLabel: Record<string, string> = {
  online: '🟢 Active',
  away: '🕐 Away',
  dnd: '🔴 Do not disturb',
  offline: '⚫ Offline',
}

export function UserCard({ user, anchorRef, onClose }: UserCardProps) {
  const { user: me } = useAuth()
  const { createOrOpenDM, setCurrentDM } = useWorkspace()
  const cardRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose, anchorRef])

  async function handleMessage() {
    const dm = await createOrOpenDM(user.uid)
    setCurrentDM(dm)
    onClose()
  }

  const isMe = user.uid === me?.uid

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 6 }}
      transition={{ duration: 0.12, type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute z-50 w-64 bg-white rounded-2xl shadow-modal border border-gray-100 overflow-hidden"
      style={{ top: '100%', left: 0, marginTop: 8 }}
    >
      {/* Cover gradient */}
      <div
        className="h-16 w-full"
        style={{ background: 'linear-gradient(135deg, #4a154b 0%, #7c3aed 100%)' }}
      />
      {/* Avatar overlapping cover */}
      <div className="px-4 pb-3 -mt-6">
        <div className="mb-2">
          <Avatar src={user.photoURL} name={user.displayName} size="lg" status={user.status} />
        </div>
        <h3 className="font-bold text-gray-900">{user.displayName}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {statusLabel[user.status] ?? '⚫ Offline'}
          {user.statusText && <span className="ml-1">· {user.statusText}</span>}
        </p>
        {user.email && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
            <Mail size={12} />
            {user.email}
          </p>
        )}
      </div>

      {!isMe && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <button
            onClick={handleMessage}
            className="btn-primary w-full py-2 text-sm justify-center"
          >
            <MessageSquare size={14} />
            Send message
          </button>
        </div>
      )}
    </motion.div>
  )
}

/** Wrap any element to make its children show a UserCard on click */
export function WithUserCard({
  user,
  children,
}: {
  user: User | undefined
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  if (!user) return <>{children}</>

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)} className="cursor-pointer">
        {children}
      </div>
      <AnimatePresence>
        {open && (
          <UserCard
            user={user}
            anchorRef={ref as React.RefObject<HTMLElement>}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Need useState import
import { useState } from 'react'
