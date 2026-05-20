import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash,
  Lock,
  Plus,
  ChevronDown,
  ChevronRight,
  MessageSquarePlus,
  Settings,
  Bell,
  Search,
  Home,
  Bookmark,
  LogOut,
  User,
  Circle,
  Moon,
  Minus,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useWorkspaceUsers } from '@/hooks/useUsers'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { CreateChannelModal } from '@/components/modals/CreateChannelModal'
import { NewDMModal } from '@/components/modals/NewDMModal'
import type { Channel, DirectMessage } from '@/types'

interface SidebarProps {
  onSearchOpen: () => void
}

export function Sidebar({ onSearchOpen }: SidebarProps) {
  const { user, logout, updateUserProfile } = useAuth()
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
  const [showNewDM, setShowNewDM] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const myChannels = channels.filter((c) => c.members.includes(user?.uid ?? ''))
  const otherChannels = channels.filter(
    (c) => !c.members.includes(user?.uid ?? '') && !c.isPrivate
  )

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

  const statusOptions = [
    { emoji: '🟢', label: 'Active', value: 'online' as const },
    { emoji: '🌙', label: 'Do not disturb', value: 'dnd' as const },
    { emoji: '🕐', label: 'Away', value: 'away' as const },
    { emoji: '⚫', label: 'Appear offline', value: 'offline' as const },
  ]

  return (
    <>
      <div className="flex flex-col h-full bg-sidebar-bg text-sidebar-text select-none overflow-hidden">
        {/* Workspace header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border hover:bg-sidebar-hover cursor-pointer transition-colors flex-shrink-0"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #4a154b 0%, #7c3aed 100%)' }}
            >
              <span className="text-white">{workspace?.name?.[0]?.toUpperCase() ?? 'W'}</span>
            </div>
            <span className="font-black text-white text-sm truncate">
              {workspace?.name ?? 'Workspace'}
            </span>
            <ChevronDown size={13} className="text-white/50 flex-shrink-0" />
          </div>
          <Tooltip content="New message (Cmd+K)">
            <button
              onClick={(e) => { e.stopPropagation(); onSearchOpen() }}
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <MessageSquarePlus size={16} />
            </button>
          </Tooltip>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2 flex-shrink-0">
          <button
            onClick={onSearchOpen}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-sidebar-text-dim hover:text-white text-sm transition-colors"
          >
            <Search size={13} />
            <span className="text-sm">Search</span>
            <span className="ml-auto text-xs opacity-40 font-mono">⌘K</span>
          </button>
        </div>

        {/* Nav items */}
        <div className="px-2 py-1 flex-shrink-0">
          {[
            { icon: Home, label: 'Home', active: !currentChannel && !currentDM },
            { icon: Bell, label: 'Activity' },
            { icon: Bookmark, label: 'Later' },
          ].map((item) => (
            <button
              key={item.label}
              className={`channel-item w-full ${item.active ? 'bg-sidebar-hover text-white' : ''}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable section */}
        <div className="flex-1 overflow-y-auto sidebar-scroll min-h-0">
          {/* Channels */}
          <div className="py-2">
            <button
              onClick={() => setChannelsOpen(!channelsOpen)}
              className="flex items-center gap-1 px-3 py-1 w-full text-sidebar-text-dim hover:text-white text-xs font-bold uppercase tracking-wider transition-colors group"
            >
              {channelsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Channels</span>
              <Tooltip content="Create channel" side="right">
                <span
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  onClick={(e) => { e.stopPropagation(); setShowCreateChannel(true) }}
                >
                  <Plus size={14} />
                </span>
              </Tooltip>
            </button>

            <AnimatePresence initial={false}>
              {channelsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 space-y-0.5 pb-1">
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
                      <>
                        <p className="text-sidebar-text-dim text-2xs px-2 pt-2 pb-1 font-semibold opacity-60">
                          More channels
                        </p>
                        {otherChannels.slice(0, 3).map((ch) => (
                          <ChannelItem
                            key={ch.id}
                            channel={ch}
                            active={currentChannel?.id === ch.id}
                            unread={0}
                            dim
                            onClick={() => handleChannelClick(ch)}
                          />
                        ))}
                      </>
                    )}
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="channel-item w-full mt-1 opacity-60 hover:opacity-100"
                    >
                      <Plus size={14} />
                      <span>Add a channel</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Direct Messages */}
          <div className="py-2">
            <button
              onClick={() => setDmsOpen(!dmsOpen)}
              className="flex items-center gap-1 px-3 py-1 w-full text-sidebar-text-dim hover:text-white text-xs font-bold uppercase tracking-wider transition-colors group"
            >
              {dmsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Direct messages</span>
              <Tooltip content="New DM" side="right">
                <span
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  onClick={(e) => { e.stopPropagation(); setShowNewDM(true) }}
                >
                  <Plus size={14} />
                </span>
              </Tooltip>
            </button>

            <AnimatePresence initial={false}>
              {dmsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-2 space-y-0.5 pb-1">
                    {dms.length === 0 ? (
                      <button
                        onClick={() => setShowNewDM(true)}
                        className="channel-item w-full opacity-60 hover:opacity-100 mt-1"
                      >
                        <Plus size={14} />
                        <span>Start a DM</span>
                      </button>
                    ) : (
                      dms.map((dm) => {
                        const dmUser = getDMUser(dm)
                        if (!dmUser) return null
                        return (
                          <button
                            key={dm.id}
                            onClick={() => handleDMClick(dm)}
                            className={`channel-item w-full ${currentDM?.id === dm.id ? 'bg-brand-DEFAULT text-white' : ''}`}
                          >
                            <Avatar
                              src={dmUser.photoURL}
                              name={dmUser.displayName}
                              size="xs"
                              status={dmUser.status}
                            />
                            <span className="truncate">{dmUser.displayName}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* User footer */}
        <div className="border-t border-sidebar-border px-3 py-3 flex-shrink-0 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 w-full rounded-lg p-1.5 hover:bg-white/10 transition-colors"
          >
            <Avatar
              src={user?.photoURL}
              name={user?.displayName ?? 'User'}
              size="sm"
              status={user?.status ?? 'online'}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-sm font-bold truncate leading-tight">
                {user?.displayName}
              </p>
              <p className="text-sidebar-text-dim text-xs capitalize">{user?.status ?? 'Active'}</p>
            </div>
            <Settings size={14} className="text-white/40 flex-shrink-0" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-popover border border-gray-100 py-2 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <div className="flex items-center gap-2">
                    <Avatar src={user?.photoURL} name={user?.displayName ?? ''} size="md" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{user?.displayName}</p>
                      <p className="text-gray-400 text-xs">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Set status
                </p>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      updateUserProfile({ status: opt.value })
                      setShowUserMenu(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      user?.status === opt.value ? 'font-semibold text-brand-DEFAULT' : 'text-gray-700'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { logout(); setShowUserMenu(false) }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateChannelModal open={showCreateChannel} onClose={() => setShowCreateChannel(false)} />
      <NewDMModal open={showNewDM} onClose={() => setShowNewDM(false)} />
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
      className={`channel-item w-full ${active ? 'bg-brand-DEFAULT text-white' : ''} ${dim ? 'opacity-50' : ''}`}
    >
      {channel.isPrivate ? (
        <Lock size={14} className="flex-shrink-0" />
      ) : (
        <Hash size={14} className="flex-shrink-0" />
      )}
      <span className={`truncate flex-1 ${unread > 0 && !active ? 'font-bold text-white' : ''}`}>
        {channel.name}
      </span>
      {unread > 0 && !active && (
        <span className="ml-auto bg-white text-brand-DEFAULT text-xs font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
