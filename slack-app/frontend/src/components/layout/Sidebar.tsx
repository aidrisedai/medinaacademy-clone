import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Home,
  Bookmark,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { CreateChannelModal } from '@/components/modals/CreateChannelModal'
import type { Channel, DirectMessage } from '@/types'

export function Sidebar() {
  const { user, logout } = useAuth()
  const {
    workspace,
    channels,
    dms,
    currentChannel,
    currentDM,
    setCurrentChannel,
    setCurrentDM,
    unreadCounts,
  } = useWorkspace()
  const { users } = useWorkspaceUsers()

  const [channelsOpen, setChannelsOpen] = useState(true)
  const [dmsOpen, setDmsOpen] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const myChannels = channels.filter((c) => c.members.includes(user?.uid ?? ''))
  const otherChannels = channels.filter((c) => !c.members.includes(user?.uid ?? ''))

  function handleChannelClick(ch: Channel) {
    setCurrentChannel(ch)
    setShowUserMenu(false)
  }

  function handleDMClick(dm: DirectMessage) {
    setCurrentDM(dm)
    setShowUserMenu(false)
  }

  function getDMUser(dm: DirectMessage) {
    const otherId = dm.members.find((id) => id !== user?.uid)
    return otherId ? users[otherId] : null
  }

  return (
    <>
      <div className="flex flex-col h-full bg-sidebar-bg text-sidebar-text select-none">
        {/* Workspace header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border hover:bg-sidebar-hover cursor-pointer transition-colors" onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {workspace?.name?.[0]?.toUpperCase() ?? 'W'}
              </span>
            </div>
            <span className="font-black text-white text-sm truncate">
              {workspace?.name ?? 'Workspace'}
            </span>
            <ChevronDown size={14} className="text-white/70 flex-shrink-0" />
          </div>
          <Tooltip content="New message">
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <MessageSquare size={16} />
            </button>
          </Tooltip>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2">
          <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-sidebar-text-dim hover:text-white text-sm transition-colors">
            <Search size={14} />
            <span>Search</span>
            <span className="ml-auto text-xs opacity-50">⌘K</span>
          </button>
        </div>

        {/* Nav items */}
        <div className="px-2 py-1">
          {[
            { icon: Home, label: 'Home', active: !currentChannel && !currentDM },
            { icon: Bell, label: 'Activity' },
            { icon: Bookmark, label: 'Later' },
          ].map((item) => (
            <button
              key={item.label}
              className={`channel-item w-full ${item.active ? 'active' : ''}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto sidebar-scroll py-2">
          {/* Channels section */}
          <div className="mb-2">
            <button
              onClick={() => setChannelsOpen(!channelsOpen)}
              className="flex items-center gap-1 px-3 py-1 w-full text-sidebar-text-dim hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors group"
            >
              {channelsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Channels</span>
              <span
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); setShowCreateChannel(true) }}
              >
                <Plus size={14} />
              </span>
            </button>

            <AnimatePresence>
              {channelsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 py-1 space-y-0.5">
                    {myChannels.map((ch) => (
                      <ChannelItem
                        key={ch.id}
                        channel={ch}
                        active={currentChannel?.id === ch.id}
                        unread={unreadCounts[ch.id] ?? 0}
                        onClick={() => handleChannelClick(ch)}
                      />
                    ))}
                    {otherChannels.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-sidebar-border">
                        <p className="text-sidebar-text-dim text-2xs px-2 mb-1">Other channels</p>
                        {otherChannels.slice(0, 5).map((ch) => (
                          <ChannelItem
                            key={ch.id}
                            channel={ch}
                            active={currentChannel?.id === ch.id}
                            unread={0}
                            dim
                            onClick={() => handleChannelClick(ch)}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="channel-item w-full mt-1"
                    >
                      <Plus size={15} className="opacity-60" />
                      <span className="opacity-60">Add a channel</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DMs section */}
          <div>
            <button
              onClick={() => setDmsOpen(!dmsOpen)}
              className="flex items-center gap-1 px-3 py-1 w-full text-sidebar-text-dim hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              {dmsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Direct Messages</span>
            </button>

            <AnimatePresence>
              {dmsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 py-1 space-y-0.5">
                    {dms.map((dm) => {
                      const dmUser = getDMUser(dm)
                      if (!dmUser) return null
                      return (
                        <button
                          key={dm.id}
                          onClick={() => handleDMClick(dm)}
                          className={`channel-item w-full ${currentDM?.id === dm.id ? 'active' : ''}`}
                        >
                          <Avatar src={dmUser.photoURL} name={dmUser.displayName} size="xs" status={dmUser.status} />
                          <span className="truncate">{dmUser.displayName}</span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User profile footer */}
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 flex-1 min-w-0 hover:bg-white/10 rounded-md p-1.5 transition-colors"
            >
              <Avatar src={user?.photoURL} name={user?.displayName ?? 'User'} size="sm" status={user?.status ?? 'online'} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-sm font-semibold truncate leading-tight">{user?.displayName}</p>
                <p className="text-sidebar-text-dim text-xs truncate">Active</p>
              </div>
            </button>
            <Tooltip content="Settings">
              <button className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Settings size={16} />
              </button>
            </Tooltip>
          </div>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-16 left-3 w-64 bg-white rounded-xl shadow-popover border border-gray-100 py-2 z-50"
            >
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="font-semibold text-gray-900 text-sm">{user?.displayName}</p>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
              {[
                { label: '🟢 Active', action: () => {} },
                { label: '🌙 Do not disturb', action: () => {} },
                { label: '⏰ Set a status', action: () => {} },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out of {workspace?.name}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <CreateChannelModal open={showCreateChannel} onClose={() => setShowCreateChannel(false)} />
    </>
  )
}

function ChannelItem({
  channel,
  active,
  unread,
  dim = false,
  onClick,
}: {
  channel: Channel
  active: boolean
  unread: number
  dim?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`channel-item w-full ${active ? 'active' : ''} ${dim ? 'opacity-60' : ''}`}
    >
      {channel.isPrivate ? <Lock size={14} className="flex-shrink-0" /> : <Hash size={14} className="flex-shrink-0" />}
      <span className={`truncate flex-1 ${unread > 0 ? 'font-bold text-white' : ''}`}>{channel.name}</span>
      {unread > 0 && !active && (
        <span className="ml-auto bg-white text-brand-DEFAULT text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
