'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Option } from '@/types'

interface OptionRowProps {
  option: Option
  isEditing: boolean
  highlightQuery?: string
  canDrag: boolean
  canPin: boolean
  canEdit: boolean
  canHide?: boolean
  isHidden?: boolean
  isDefault?: boolean   // this option is the field's default — cannot be hidden
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent, idx: number) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, idx: number) => void
  onDragEnd: () => void
  index: number
  onMerge: () => void
  onEdit: () => void
  onSaveEdit: (newLabel: string) => void
  onCancelEdit: () => void
  onDelete: () => void
  onPin: () => void
  onToggleHide?: () => void
}

const deleteIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const mergeIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 4h4l2 2-2 2H3M13 4h-4l-2 2 2 2h4M8 6v6M8 12l-2-2M8 12l2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const tickIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const crossIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const pinIcon = (isPinned: boolean) => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path
      d="M9.5 1.5L14.5 6.5L11 10H9.5L8 13.5L6.5 10H5L1.5 6.5L6.5 1.5H9.5Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"
      fill={isPinned ? 'currentColor' : 'none'} fillOpacity={isPinned ? 0.18 : 0}
    />
    <line x1="8" y1="10" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
// Visible eye
const eyeIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
)
// Hidden eye-slash
const eyeSlashIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function renderHighlighted(text: string, query: string) {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${escapeRegex(query)})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontWeight: 600, borderRadius: 2, padding: 0 }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

export default function OptionRow({
  option, isEditing, highlightQuery = '', index,
  canDrag, canPin, canEdit, canHide = false, isHidden = false, isDefault = false,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  onMerge, onEdit, onSaveEdit, onCancelEdit, onDelete, onPin, onToggleHide,
}: OptionRowProps) {
  const [editVal, setEditVal] = useState(option.label)
  const [inputWidth, setInputWidth] = useState<number>(120)
  const [isDragOver, setIsDragOver] = useState(false)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; align?: 'center' | 'right' } | null>(null)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mirrorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isEditing) {
      setEditVal(option.label)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isEditing, option.label])

  useLayoutEffect(() => {
    if (isEditing && mirrorRef.current) {
      setInputWidth(Math.min(340, Math.max(60, mirrorRef.current.offsetWidth + 20)))
    }
  }, [editVal, isEditing])

  function showTooltip(text: string, e: React.MouseEvent, align: 'center' | 'right' = 'center') {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    if (align === 'right') {
      // Tooltip extends left; anchor to icon center + small offset so arrow sits on icon
      setTooltip({ text, x: cx + 7, y: rect.top, align: 'right' })
    } else {
      // Clamp so centered tooltip never clips the right edge
      const x = Math.min(cx, window.innerWidth - 85)
      setTooltip({ text, x, y: rect.top, align: 'center' })
    }
  }

  const isPinned = !!option.pinned

  return (
    <>
      <div
        className={`opt-row${isDragOver ? ' drag-over' : ''}${isHidden ? ' opt-row-hidden' : ''}`}
        draggable={canDrag && !isEditing}
        onDragStart={() => canDrag && !isEditing && onDragStart(index)}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e, index) }}
        onDragLeave={e => { setIsDragOver(false); onDragLeave(e) }}
        onDrop={e => { setIsDragOver(false); onDrop(e, index) }}
        onDragEnd={() => { setIsDragOver(false); onDragEnd() }}
      >
        {/* Left: drag handle or eye-slash status icon */}
        {isHidden ? (
          <span className="opt-hidden-icon">{eyeSlashIcon}</span>
        ) : (
          <span
            className="drag-handle"
            style={{ visibility: canDrag && !isEditing ? 'visible' : 'hidden' }}
          >
            ⠿
          </span>
        )}

        {/* Mirror span for measuring edit input width */}
        {isEditing && (
          <span ref={mirrorRef} style={{
            position: 'absolute', left: -9999, top: 0,
            visibility: 'hidden', whiteSpace: 'pre',
            fontSize: 13, fontFamily: 'inherit', pointerEvents: 'none',
          }}>
            {editVal}
          </span>
        )}

        {/* Label / inline edit */}
        {isEditing && canEdit ? (
          <input
            ref={inputRef}
            className="opt-inline-edit-input"
            style={{ width: inputWidth }}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSaveEdit(editVal)
              if (e.key === 'Escape') onCancelEdit()
            }}
            onBlur={onCancelEdit}
          />
        ) : canEdit ? (
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <span
              className="opt-label-editable"
              onClick={() => { setEditVal(option.label); onEdit() }}
              title="Click to edit"
            >
              {renderHighlighted(option.label, highlightQuery)}
            </span>
          </span>
        ) : (
          <span className={`opt-label${isHidden ? ' opt-label-muted' : ''}`}>
            {renderHighlighted(option.label, highlightQuery)}
          </span>
        )}

        {/* Field-library edit actions */}
        {canEdit && (
          <div className="row-actions">
            {isEditing ? (
              <>
                <button className="icon-btn confirm" onMouseDown={e => e.preventDefault()} onClick={() => onSaveEdit(editVal)} title="Save">{tickIcon}</button>
                <button className="icon-btn cancel-edit" onMouseDown={e => e.preventDefault()} onClick={onCancelEdit} title="Cancel">{crossIcon}</button>
              </>
            ) : (
              <>
                <button
                  className={`icon-btn pin${isPinned ? ' pinned' : ''}`}
                  onMouseEnter={e => showTooltip(isPinned ? 'Unpin' : (canPin ? 'Pin to top' : 'Max 10 pinned'), e)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={onPin}
                  style={!canPin && !isPinned ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                >
                  {pinIcon(isPinned)}
                </button>
                <button
                  className="icon-btn merge"
                  onMouseEnter={e => showTooltip('Merge', e)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={onMerge}
                >
                  {mergeIcon}
                </button>
                <button
                  className="icon-btn del"
                  onMouseEnter={e => showTooltip('Delete', e)}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={onDelete}
                >
                  {deleteIcon}
                </button>
              </>
            )}
          </div>
        )}

        {/* Matter-context hide toggle — always shown on hover (or always for hidden rows) */}
        {canHide && !canEdit && (
          <div className="row-actions">
            <button
              className={`icon-btn eye-toggle${isHidden ? ' is-hidden' : ''}`}
              onMouseEnter={e => showTooltip(
                isDefault
                  ? 'Cannot hide the default option'
                  : isHidden
                    ? 'Make available'
                    : 'Hide from this matter type',
                e,
                'right',
              )}
              onMouseLeave={() => setTooltip(null)}
              onClick={isDefault ? undefined : onToggleHide}
              style={isDefault ? { opacity: 0.3, cursor: 'not-allowed', pointerEvents: 'auto' } : undefined}
            >
              {isHidden ? eyeIcon : eyeSlashIcon}
            </button>
          </div>
        )}
      </div>

      {/* Portal tooltip */}
      {mounted && tooltip && createPortal(
        <div style={{
          position: 'fixed',
          top: tooltip.y - 8,
          left: tooltip.x,
          // right-align: extend tooltip to the left of the anchor point
          transform: tooltip.align === 'right'
            ? 'translateX(-100%) translateY(-100%)'
            : 'translateX(-50%) translateY(-100%)',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: 11,
          padding: '3px 7px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          {tooltip.text}
          <div style={{
            position: 'absolute',
            top: '100%',
            // right-aligned arrow sits near the right edge of the bubble
            ...(tooltip.align === 'right'
              ? { right: 5, left: 'auto', transform: 'none' }
              : { left: '50%', transform: 'translateX(-50%)' }
            ),
            border: '4px solid transparent',
            borderTopColor: '#1a1a1a',
          }} />
        </div>,
        document.body,
      )}
    </>
  )
}
