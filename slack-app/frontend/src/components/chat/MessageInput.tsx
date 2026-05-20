import React, { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold,
  Italic,
  Strikethrough,
  Link,
  Code,
  List,
  Paperclip,
  Smile,
  AtSign,
  Send,
  X,
  Image,
} from 'lucide-react'
import EmojiMartPicker from '@emoji-mart/react'
import EmojiData from '@emoji-mart/data'
import type { Attachment } from '@/types'

interface MessageInputProps {
  placeholder: string
  onSend: (text: string, attachments: Attachment[]) => void
  onTyping?: () => void
  disabled?: boolean
  autoFocus?: boolean
}

export function MessageInput({ placeholder, onSend, onTyping, disabled, autoFocus }: MessageInputProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showEmoji, setShowEmoji] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    adjustHeight()
    onTyping?.()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed && attachments.length === 0) return
    onSend(trimmed, attachments)
    setText('')
    setAttachments([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function insertFormatting(before: string, after: string = '') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = text.slice(start, end)
    const newText = text.slice(0, start) + before + selected + after + text.slice(end)
    setText(newText)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  function handleEmojiSelect(emoji: { native: string }) {
    setText((prev) => prev + emoji.native)
    setShowEmoji(false)
    textareaRef.current?.focus()
  }

  async function handleFileSelect(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    // File upload handled by parent via uploadFile hook
    // For now, simulate with base64 for images
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
        const url = URL.createObjectURL(file)
        setAttachments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: 'image',
            name: file.name,
            url,
            size: file.size,
            mimeType: file.type,
          },
        ])
      }
    }
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled

  return (
    <div className="relative">
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-brand-50 border-2 border-dashed border-brand-DEFAULT rounded-xl flex items-center justify-center"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="text-center">
              <Image size={32} className="text-brand-DEFAULT mx-auto mb-2" />
              <p className="text-sm font-semibold text-brand-DEFAULT">Drop files to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`border-2 rounded-xl transition-all duration-150 ${
          isDragging ? 'border-brand-DEFAULT' : 'border-gray-300 focus-within:border-brand-DEFAULT'
        } bg-white shadow-sm`}
        onDragEnter={() => setIsDragging(true)}
      >
        {/* Formatting toolbar */}
        <div className="flex items-center gap-0.5 px-3 pt-2.5 pb-1 border-b border-gray-100">
          {[
            { icon: Bold, label: 'Bold', action: () => insertFormatting('*', '*') },
            { icon: Italic, label: 'Italic', action: () => insertFormatting('_', '_') },
            { icon: Strikethrough, label: 'Strikethrough', action: () => insertFormatting('~', '~') },
            null,
            { icon: Link, label: 'Link', action: () => insertFormatting('[', '](url)') },
            { icon: Code, label: 'Code', action: () => insertFormatting('`', '`') },
            { icon: List, label: 'List', action: () => insertFormatting('• ') },
          ].map((item, i) =>
            item === null ? (
              <div key={i} className="w-px h-4 bg-gray-200 mx-1" />
            ) : (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                title={item.label}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <item.icon size={14} />
              </button>
            )
          )}
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-gray-100">
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <span className="text-lg">📎</span>
                    <span className="text-xs text-gray-600 max-w-24 truncate">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text input */}
        <div className="relative px-3 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            rows={1}
            className="w-full resize-none bg-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none leading-relaxed"
            style={{ minHeight: '24px', maxHeight: '200px' }}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Attach files"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Emoji"
          >
            <Smile size={16} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Mention someone"
          >
            <AtSign size={16} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Shift+Enter for new line</span>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!canSend}
            className={`ml-2 p-2 rounded-lg transition-all duration-150 ${
              canSend
                ? 'bg-brand-DEFAULT hover:bg-brand-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Send message (Enter)"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 z-50 shadow-popover rounded-xl overflow-hidden"
          >
            <EmojiMartPicker
              data={EmojiData}
              onEmojiSelect={handleEmojiSelect}
              onClickOutside={() => setShowEmoji(false)}
              theme="light"
              previewPosition="none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
