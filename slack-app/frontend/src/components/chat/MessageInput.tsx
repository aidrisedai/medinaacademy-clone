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
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import EmojiMartPicker from '@emoji-mart/react'
import EmojiData from '@emoji-mart/data'
import type { Attachment } from '@/types'

interface MessageInputProps {
  placeholder: string
  onSend: (text: string, attachments: Attachment[]) => void
  onTyping?: () => void
  onUpload?: (file: File) => Promise<Attachment>
  disabled?: boolean
  autoFocus?: boolean
}

export function MessageInput({
  placeholder,
  onSend,
  onTyping,
  onUpload,
  disabled,
  autoFocus,
}: MessageInputProps) {
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

  function insertFormatting(before: string, after = '') {
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

    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      if (onUpload) {
        // Real upload to Firebase Storage
        try {
          const att = await onUpload(file)
          newAttachments.push(att)
        } catch (err) {
          console.error('Upload failed:', err)
        }
      } else {
        // Fallback: local preview only (loses on reload, but OK for dev)
        newAttachments.push({
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          mimeType: file.type,
        })
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments])
    setUploading(false)
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled && !uploading

  return (
    <div className="relative">
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-brand-50 border-2 border-dashed border-brand-DEFAULT rounded-xl flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <ImageIcon size={28} className="text-brand-DEFAULT mx-auto mb-2" />
              <p className="text-sm font-semibold text-brand-DEFAULT">Drop to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`border-2 rounded-xl transition-all duration-150 bg-white shadow-sm ${
          isDragging
            ? 'border-brand-DEFAULT'
            : 'border-gray-300 focus-within:border-brand-DEFAULT'
        }`}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
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
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 max-w-48">
                    <span className="text-lg">📎</span>
                    <span className="text-xs text-gray-600 truncate">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                <Loader2 size={18} className="text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Text area */}
        <div className="px-3 py-2">
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
        <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-100">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
            title="Attach files"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
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

          <span className="hidden sm:block text-xs text-gray-300 mr-2">Shift+Enter for new line</span>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2 rounded-lg transition-all duration-150 ${
              canSend
                ? 'bg-brand-DEFAULT hover:bg-brand-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
            title="Send (Enter)"
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
