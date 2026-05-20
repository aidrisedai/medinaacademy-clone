import React from 'react'
import { Sidebar } from './Sidebar'
import { ChannelView } from '@/components/chat/ChannelView'
import { DMView } from '@/components/chat/DMView'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export function AppLayout() {
  const { currentChannel, currentDM } = useWorkspace()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 overflow-hidden">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {currentDM ? (
          <DMView />
        ) : (
          <ChannelView />
        )}
      </div>
    </div>
  )
}
