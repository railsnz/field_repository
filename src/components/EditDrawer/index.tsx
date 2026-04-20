'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Field, Option } from '@/types'
import FieldConfig from './FieldConfig'
import OptionsPanel from './OptionsPanel'

const MIN_WIDTH = 320
const MAX_WIDTH = 1200
const DEFAULT_WIDTH = 780
const LS_KEY = 'lawvu-drawer-width'

interface EditDrawerProps {
  field: Field | null
  options: Option[]
  isOpen: boolean
  context?: 'field' | 'matter'
  contextLabel?: string
  hiddenMatterOptIds?: Set<string>
  showCreateAlias?: boolean
  onToggleHiddenOpt?: (optId: string) => void
  onResetHiddenOpts?: () => void
  onClose: () => void
  onUpdateField: (updates: Partial<Field>) => Promise<void>
  onAddOption: (label: string) => Promise<void>
  onDeleteOption: (optId: string) => Promise<void>
  onRenameOption: (optId: string, newLabel: string) => Promise<void>
  onSortOptions: () => Promise<void>
  onReorderOptions: (newOrder: Option[]) => Promise<void>
  onMergeOption: (opt: Option) => void
  onOpenPreview: () => void
  onOpenInfoDelete: (mode: 'info' | 'delete') => void
  onSnackbar: (msg: string, undoFn?: () => Promise<void>) => void
}

export default function EditDrawer({
  field, options, isOpen, context = 'field', contextLabel,
  hiddenMatterOptIds, showCreateAlias = false, onToggleHiddenOpt, onResetHiddenOpts,
  onClose, onUpdateField, onAddOption, onDeleteOption, onRenameOption,
  onSortOptions, onReorderOptions, onMergeOption,
  onOpenPreview, onOpenInfoDelete, onSnackbar,
}: EditDrawerProps) {
  const [ellipsisOpen, setEllipsisOpen] = useState(false)
  const ellipsisRef = useRef<HTMLDivElement>(null)
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_WIDTH)

  // Restore persisted width after mount (avoids SSR/client hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed)) setDrawerWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed)))
    }
  }, [])
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef<number>(0)
  const dragStartWidth = useRef<number>(DEFAULT_WIDTH)

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragStartX.current = e.clientX
    dragStartWidth.current = drawerWidth
    setIsDragging(true)
  }, [drawerWidth])

  useEffect(() => {
    if (!isDragging) return
    function onMouseMove(e: MouseEvent) {
      const delta = dragStartX.current - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartWidth.current + delta))
      setDrawerWidth(newWidth)
    }
    function onMouseUp() {
      setIsDragging(false)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  // Persist width to localStorage whenever it settles after a drag
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(LS_KEY, String(drawerWidth))
    }
  }, [isDragging, drawerWidth])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ellipsisRef.current && !ellipsisRef.current.contains(e.target as Node)) {
        setEllipsisOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Reset ellipsis on close
  useEffect(() => {
    if (!isOpen) setEllipsisOpen(false)
  }, [isOpen])

  return (
    <div
      className={`drawer${isOpen ? ' open' : ''}`}
      style={{ width: drawerWidth, userSelect: isDragging ? 'none' : undefined }}
    >
      {/* Drag handle — left edge */}
      <div
        className={`drawer-resize-handle${isDragging ? ' dragging' : ''}`}
        onMouseDown={handleResizeMouseDown}
      />
      <div className="drawer-header">
        <span className="drawer-title">{context === 'matter' ? 'Customize field' : 'Edit field'}</span>
        {field && <span className="type-badge">{field.type}</span>}
        <div className="header-actions">
          <button className="preview-btn" onClick={onOpenPreview}>Preview</button>
          <button className="hdr-btn mono-btn" title="Field schema">{'{ }'}</button>
          <div ref={ellipsisRef} style={{ position: 'relative' }}>
            <button
              className="hdr-btn"
              title="More options"
              onClick={e => { e.stopPropagation(); setEllipsisOpen(v => !v) }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="3" cy="8" r="1.2" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
                <circle cx="13" cy="8" r="1.2" fill="currentColor"/>
              </svg>
            </button>
            <div className={`ellipsis-menu${ellipsisOpen ? ' open' : ''}`}>
              <div className="ellipsis-item" onClick={() => { setEllipsisOpen(false); onOpenInfoDelete('info') }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Info
              </div>
              <div className="ellipsis-item danger" onClick={() => { setEllipsisOpen(false); onOpenInfoDelete('delete') }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete field
              </div>
            </div>
          </div>
          <div className="hdr-sep" />
          <button className="hdr-btn" title="Close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="drawer-body">
        {context === 'matter' && contextLabel && (
          <div className="drawer-context-alert">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 7v4M8 5.2v.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>
              Customizing for <strong>{contextLabel}</strong>{' '}only. Changes here don&apos;t affect the global field or other templates.
            </span>
          </div>
        )}
        {field && (
          <>
            <FieldConfig
              field={field}
              options={options}
              context={context}
              showCreateAlias={showCreateAlias}
              onUpdateField={onUpdateField}
              onSnackbar={onSnackbar}
            />
            <OptionsPanel
              fieldId={field.id}
              options={options}
              context={context}
              defaultOption={field.defaultOption}
              hiddenOptIds={hiddenMatterOptIds}
              onToggleHide={onToggleHiddenOpt}
              onResetHiddenOpts={onResetHiddenOpts}
              onAddOption={onAddOption}
              onDeleteOption={onDeleteOption}
              onRenameOption={onRenameOption}
              onSortOptions={onSortOptions}
              onReorderOptions={onReorderOptions}
              onMergeOption={onMergeOption}
              onSnackbar={onSnackbar}
            />
          </>
        )}
      </div>
    </div>
  )
}
