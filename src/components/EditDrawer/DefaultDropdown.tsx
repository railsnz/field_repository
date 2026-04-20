'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Option } from '@/types'

interface DefaultDropdownProps {
  inputRef: React.RefObject<HTMLInputElement | null>
  options: Option[]
  value: string
  onChange: (val: string) => void
  onSelect: (val: string) => void
  visible: boolean
  onHide: () => void
}

export default function DefaultDropdown({
  inputRef, options, value, onChange, onSelect, visible, onHide,
}: DefaultDropdownProps) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (visible && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
    }
  }, [visible, inputRef])

  const filtered = value
    ? options.filter(o => o.label.toLowerCase().includes(value.toLowerCase()))
    : options

  if (!mounted || !visible) return null

  return createPortal(
    <div
      className="fixed-dropdown"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <div
        className="fixed-dropdown-none"
        onMouseDown={() => { onSelect('') }}
      >
        — None —
      </div>
      {filtered.slice(0, 20).map(opt => (
        <div
          key={opt.id}
          className="fixed-dropdown-item"
          onMouseDown={() => { onSelect(opt.label) }}
        >
          {opt.label}
        </div>
      ))}
    </div>,
    document.body,
  )
}
