import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Hash, User, MessageSquare, X, Clock } from 'lucide-react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getFirestore,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import type { Channel, Message, User as UserType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

type ResultType = 'channel' | 'user' | 'message'
interface Result {
  type: ResultType
  id: string
  label: string
  sub?: string
  raw?: Channel | UserType | Message
}

export function SearchModal({ open, onClose }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { channels, setCurrentChannel, createOrOpenDM } = useWorkspace()
  const { users } = useWorkspaceUsers()

  useEffect(() => {
    if (open) {
      setQ('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!q.trim()) {
      // Show recent channels as default
      const recent: Result[] = channels.slice(0, 5).map((ch) => ({
        type: 'channel',
        id: ch.id,
        label: ch.name,
        sub: ch.description,
        raw: ch,
      }))
      setResults(recent)
      return
    }

    const debounce = setTimeout(() => doSearch(q.trim()), 200)
    return () => clearTimeout(debounce)
  }, [q, channels, users])

  async function doSearch(term: string) {
    setLoading(true)
    const lower = term.toLowerCase()
    const res: Result[] = []

    // Search channels
    channels
      .filter((ch) => ch.name.includes(lower) || ch.description?.toLowerCase().includes(lower))
      .slice(0, 4)
      .forEach((ch) => res.push({ type: 'channel', id: ch.id, label: ch.name, sub: ch.description, raw: ch }))

    // Search users
    Object.values(users)
      .filter((u) => u.displayName.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower))
      .slice(0, 4)
      .forEach((u) => res.push({ type: 'user', id: u.uid, label: u.displayName, sub: u.email, raw: u }))

    // Search messages (limited)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'messages'),
          where('workspaceId', '==', 'demo-workspace'),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      )
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Message))
        .filter((m) => m.text?.toLowerCase().includes(lower))
        .slice(0, 3)
        .forEach((m) => {
          const ch = channels.find((c) => c.id === m.channelId)
          res.push({
            type: 'message',
            id: m.id,
            label: m.text.slice(0, 60) + (m.text.length > 60 ? '…' : ''),
            sub: ch ? `#${ch.name}` : '',
            raw: m,
          })
        })
    } catch {}

    setResults(res)
    setSelected(0)
    setLoading(false)
  }

  function handleSelect(r: Result) {
    if (r.type === 'channel') {
      const ch = channels.find((c) => c.id === r.id)
      if (ch) setCurrentChannel(ch)
    } else if (r.type === 'user') {
      createOrOpenDM(r.id)
    } else if (r.type === 'message') {
      const msg = r.raw as Message
      const ch = channels.find((c) => c.id === msg.channelId)
      if (ch) setCurrentChannel(ch)
    }
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selected]) handleSelect(results[selected])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const typeIcon = { channel: Hash, user: User, message: MessageSquare }
  const typeLabel = { channel: 'Channel', user: 'Person', message: 'Message' }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search messages, channels, people…"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500 font-mono">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-1">
              {!q && (
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={11} /> Recent
                </p>
              )}
              {results.length === 0 && !loading && q && (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">
                  No results for "<span className="font-medium text-gray-600">{q}</span>"
                </div>
              )}
              {results.map((r, i) => {
                const Icon = typeIcon[r.type]
                return (
                  <button
                    key={r.id + r.type}
                    onClick={() => handleSelect(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selected ? 'bg-brand-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      r.type === 'channel' ? 'bg-purple-100' :
                      r.type === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon size={15} className={
                        r.type === 'channel' ? 'text-purple-600' :
                        r.type === 'user' ? 'text-blue-600' : 'text-gray-500'
                      } />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                      {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">{typeLabel[r.type]}</span>
                  </button>
                )
              })}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
              {[
                ['↑↓', 'navigate'],
                ['↵', 'select'],
                ['esc', 'close'],
              ].map(([key, label]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono shadow-sm">
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
