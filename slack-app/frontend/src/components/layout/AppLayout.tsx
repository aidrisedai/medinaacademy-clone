import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ChannelView } from '@/components/chat/ChannelView'
import { DMView } from '@/components/chat/DMView'
import { SearchModal } from '@/components/modals/SearchModal'
import { Toaster } from '@/components/ui/Toaster'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useKeyboard } from '@/hooks/useKeyboard'

export function AppLayout() {
  const { currentChannel, currentDM, workspace } = useWorkspace()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Update document title
  useEffect(() => {
    const name = currentChannel
      ? `#${currentChannel.name} — ${workspace?.name ?? 'SlackApp'}`
      : currentDM
      ? `DM — ${workspace?.name ?? 'SlackApp'}`
      : workspace?.name ?? 'SlackApp'
    document.title = name
  }, [currentChannel, currentDM, workspace])

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [currentChannel, currentDM])

  // Keyboard shortcuts
  useKeyboard({
    'mod+k': (e) => { e.preventDefault(); setSearchOpen(true) },
    'mod+/': (e) => { e.preventDefault(); setSearchOpen(true) },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-64 flex-shrink-0 transition-transform duration-200
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar onSearchOpen={() => setSearchOpen(true)} />
      </div>

      {/* Mobile header */}
      <div className="flex lg:hidden items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white fixed top-0 left-0 right-0 z-30">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-bold text-gray-900 text-sm">
          {currentChannel ? `#${currentChannel.name}` : workspace?.name ?? 'SlackApp'}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-w-0 overflow-hidden lg:mt-0 mt-14">
        {currentDM ? <DMView /> : <ChannelView />}
      </div>

      {/* Global modals */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
