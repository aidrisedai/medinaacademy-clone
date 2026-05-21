import React, { useState } from 'react'
import { Hash, Lock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateChannelModal({ open, onClose }: Props) {
  const { createChannel, setCurrentChannel } = useWorkspace()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Channel name is required')

    setLoading(true)
    try {
      const channel = await createChannel(name.trim(), description.trim(), isPrivate)
      setCurrentChannel(channel)
      setName('')
      setDescription('')
      setIsPrivate(false)
      onClose()
    } catch (err) {
      setError('Failed to create channel')
    } finally {
      setLoading(false)
    }
  }

  const slugified = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <Modal open={open} onClose={onClose} title="Create a channel" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. marketing, design"
              className="input pl-7"
              maxLength={80}
              autoFocus
            />
          </div>
          {name && (
            <p className="text-xs text-gray-400 mt-1">
              Channel URL: <span className="font-mono">#{slugified}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this channel about?"
            className="input"
            maxLength={250}
          />
          <p className="text-xs text-gray-400 mt-1">
            {description.length}/250 — optional but helpful
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Visibility</label>
          <div className="space-y-2">
            {[
              { value: false, icon: Hash, title: 'Public', desc: 'Anyone in the workspace can view and join' },
              { value: true, icon: Lock, title: 'Private', desc: 'Only invited members can view and join' },
            ].map((opt) => (
              <label
                key={String(opt.value)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  isPrivate === opt.value
                    ? 'border-brand bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  className="sr-only"
                  checked={isPrivate === opt.value}
                  onChange={() => setIsPrivate(opt.value)}
                />
                <opt.icon
                  size={18}
                  className={isPrivate === opt.value ? 'text-brand' : 'text-gray-500'}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{opt.title}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading || !name.trim()} className="btn-primary">
            {loading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
