import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

export function NewDMModal({ open, onClose }: Props) {
  const { user } = useAuth()
  const { users } = useWorkspaceUsers()
  const { createOrOpenDM, setCurrentDM } = useWorkspace()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filteredUsers = Object.values(users).filter(
    (u) =>
      u.uid !== user?.uid &&
      (u.displayName.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()))
  )

  async function handleSelect(uid: string) {
    setLoading(true)
    try {
      const dm = await createOrOpenDM(uid)
      setCurrentDM(dm)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New direct message" size="sm">
      <div className="-mt-2">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a person…"
            className="input pl-9"
          />
        </div>

        <div className="max-h-64 overflow-y-auto -mx-1">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-center text-gray-400 py-6">
              {q ? 'No users found' : 'No other users in this workspace yet'}
            </p>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.uid}
                onClick={() => handleSelect(u.uid)}
                disabled={loading}
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Avatar src={u.photoURL} name={u.displayName} size="sm" status={u.status} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{u.displayName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
