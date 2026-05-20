import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, side = 'top', delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    const id = setTimeout(() => setVisible(true), delay)
    setTimeoutId(id)
  }

  const hide = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setVisible(false)
  }

  const positions = {
    top: { tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2', arrow: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800' },
    bottom: { tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2', arrow: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800' },
    left: { tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2', arrow: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800' },
    right: { tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2', arrow: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800' },
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.1 }}
            className={`absolute z-50 ${positions[side].tooltip} pointer-events-none`}
          >
            <div className="bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
