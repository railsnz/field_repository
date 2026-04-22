'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Field, Option } from '@/types'

interface PreviewModalProps {
  field: Field | null
  options: Option[]
  isOpen: boolean
  onClose: () => void
}

export default function PreviewModal({ field, options, isOpen, onClose }: PreviewModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchVal, setSearchVal] = useState('')
  const [dropVisible, setDropVisible] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isMulti = field?.type.toLowerCase().includes('multi') ?? false

  useEffect(() => { setMounted(true) }, [])

  // Reset on open — pre-populate default option if set
  useEffect(() => {
    if (isOpen) {
      const def = field?.defaultOption ?? ''
      if (def) {
        setSelectedTags([def])
        setSearchVal(isMulti ? '' : def)
      } else {
        setSelectedTags([])
        setSearchVal('')
      }
      setDropVisible(false)
    }
  }, [isOpen, field?.id])

  function showDrop() {
    if (!boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    setDropVisible(true)
  }

  const allFiltered = searchVal
    ? options.filter(o => o.label.toLowerCase().includes(searchVal.toLowerCase()))
    : options
  // Pin section temporarily hidden
  // const hasPinnedSection = !searchVal && options.some(o => o.pinned)
  // const filteredPinned = hasPinnedSection ? allFiltered.filter(o => o.pinned) : []
  // const filteredUnpinned = hasPinnedSection ? allFiltered.filter(o => !o.pinned) : allFiltered
  const filteredOpts = allFiltered

  function selectOpt(label: string) {
    if (isMulti) {
      setSelectedTags(prev =>
        prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label],
      )
      setSearchVal('')
      inputRef.current?.focus()
    } else {
      setSelectedTags([label])
      setSearchVal(label)
      setDropVisible(false)
    }
  }

  function renderDropdownItem(opt: Option) {
    const isSel = selectedTags.includes(opt.label)
    return (
      <div
        key={opt.id}
        className={`preview-dropdown-item${isSel ? ' selected' : ''}`}
        onMouseDown={e => { e.preventDefault(); selectOpt(opt.label) }}
      >
        {isSel
          ? <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : <span style={{ width: 13, display: 'inline-block' }} />}
        {opt.label}
      </div>
    )
  }

  if (!field) return null

  const inputPlaceholder = field.placeholder || (isMulti ? 'Search…' : 'Search…')

  return (
    <>
      <div
        className={`modal-backdrop${isOpen ? ' open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) { onClose(); setDropVisible(false) } }}
      >
        <div className="modal preview-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Preview — {field.name}</span>
            <button className="modal-close" onClick={() => { onClose(); setDropVisible(false) }}>✕</button>
          </div>
          <div className="modal-body">
            <div className="preview-field-wrap">
              <div className="preview-field-label">{field.name}</div>
              {field.description && <div className="preview-field-hint">{field.description}</div>}
              <div style={{ position: 'relative' }}>
                <div
                  ref={boxRef}
                  className="preview-tags-box"
                  onClick={() => inputRef.current?.focus()}
                >
                  {isMulti && selectedTags.map(tag => (
                    <span key={tag} className="preview-tag">
                      {tag}
                      <span
                        className="preview-tag-x"
                        onMouseDown={e => { e.preventDefault(); selectOpt(tag) }}
                      >×</span>
                    </span>
                  ))}
                  <input
                    ref={inputRef}
                    className="preview-search-input"
                    value={searchVal}
                    placeholder={selectedTags.length === 0 ? inputPlaceholder : ''}
                    onChange={e => {
                      setSearchVal(e.target.value)
                      if (!isMulti) setSelectedTags([])
                    }}
                    onFocus={e => {
                      showDrop()
                      // Move cursor to start so it doesn't sit at end of a long selected value
                      e.currentTarget.setSelectionRange(0, 0)
                    }}
                    onBlur={() => setTimeout(() => setDropVisible(false), 150)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mounted && dropVisible && createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            background: '#fff',
            border: '1px solid #e0e0da',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            maxHeight: 240,
            overflowY: 'auto',
            zIndex: 600,
          }}
        >
          {filteredOpts.length === 0 ? (
            <div style={{ padding: 12, color: '#aaa', fontSize: 13, textAlign: 'center' }}>No results</div>
          ) : (
            filteredOpts.map(opt => renderDropdownItem(opt))
          )}
        </div>,
        document.body,
      )}
    </>
  )
}
