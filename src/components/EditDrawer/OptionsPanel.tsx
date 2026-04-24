'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Option } from '@/types'
import OptionRow from './OptionRow'

// const MAX_PINNED = 10  // temporarily hidden (pin feature)

const checkIcon = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const sortIcon = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)
const chevronDownIcon = (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const pillCross = (
  <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

interface OptionsPanelProps {
  fieldId: string
  options: Option[]
  context?: 'field' | 'matter'
  defaultOption?: string          // label of the current default — cannot be hidden
  hiddenOptIds?: Set<string>      // managed by parent in matter context
  onToggleHide?: (optId: string) => void
  onResetHiddenOpts?: () => void
  onAddOption: (label: string) => Promise<void>
  onDeleteOption: (optId: string) => Promise<void>
  onRenameOption: (optId: string, newLabel: string) => Promise<void>
  onSortOptions: () => Promise<void>
  onReorderOptions: (newOrder: Option[]) => Promise<void>
  onMergeOption: (opt: Option) => void
  onSnackbar: (msg: string, undoFn?: () => Promise<void>) => void
}

export default function OptionsPanel({
  fieldId, options, context = 'field',
  defaultOption = '',
  hiddenOptIds = new Set(),
  onToggleHide, onResetHiddenOpts,
  onAddOption, onDeleteOption, onRenameOption, onSortOptions, onReorderOptions,
  onMergeOption, onSnackbar,
}: OptionsPanelProps) {
  const [open, setOpen] = useState(true)
  const [addInput, setAddInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingOptId, setEditingOptId] = useState<string | null>(null)
  const [pendingDeleteOpt, setPendingDeleteOpt] = useState<Option | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const [sortMode, setSortMode] = useState<'az' | 'custom'>('custom')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [sortingInProgress, setSortingInProgress] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  // const pinnedDragSrc = useRef<number | null>(null)  // temporarily hidden
  // const unpinnedDragSrc = useRef<number | null>(null)  // temporarily hidden
  const unpinnedDragSrc = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  function showTip(text: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({ text, x: rect.left + rect.width / 2, y: rect.top })
  }

  useEffect(() => {
    setSortMode('custom')
    setSortMenuOpen(false)
    setSearchQuery('')
    setAddInput('')
  }, [fieldId])

  useEffect(() => {
    if (!sortMenuOpen) return
    function handler(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setSortMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortMenuOpen])

  // const pinnedOpts = options.filter(o => o.pinned)  // temporarily hidden
  // const unpinnedOpts = options.filter(o => !o.pinned)  // temporarily hidden
  const isSearching = searchQuery.length > 0
  const canDragUnpinned = sortMode === 'custom' && !isSearching

  // Matter: hidden / visible split
  const hiddenOpts = context === 'matter' ? options.filter(o => hiddenOptIds.has(o.id)) : []
  const visibleOpts = context === 'matter' ? options.filter(o => !hiddenOptIds.has(o.id)) : []

  // Search only over the searchable pool (hidden opts are excluded in matter context)
  const searchPool = context === 'matter' ? visibleOpts : options
  const searchResults = isSearching
    ? searchPool.filter(o => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  // ── Add ──────────────────────────────────────────────
  async function handleAdd() {
    const val = addInput.trim()
    if (!val) return
    setAddInput('')
    setSearchQuery('')
    await onAddOption(val)
    onSnackbar(`"${val}" added`, async () => {
      const newOpt = options.find(o => o.label === val)
      if (newOpt) await onDeleteOption(newOpt.id)
    })
  }

  // ── Delete ───────────────────────────────────────────
  async function handleDelete(opt: Option) {
    const prev = [...options]
    await onDeleteOption(opt.id)
    onSnackbar(`"${opt.label}" deleted`, async () => { await onReorderOptions(prev) })
  }

  // ── Rename ───────────────────────────────────────────
  async function handleSaveEdit(opt: Option, newLabel: string) {
    if (!newLabel.trim() || newLabel.trim() === opt.label) { setEditingOptId(null); return }
    const prev = opt.label
    setEditingOptId(null)
    await onRenameOption(opt.id, newLabel.trim())
    onSnackbar(`Renamed to "${newLabel.trim()}"`, async () => { await onRenameOption(opt.id, prev) })
  }

  // ── Sort ─────────────────────────────────────────────
  async function handleSortAZ() {
    setSortMenuOpen(false)
    setSortingInProgress(true)
    const prev = [...options]
    setSortMode('az')
    await Promise.all([onSortOptions(), new Promise(r => setTimeout(r, 500))])
    setSortingInProgress(false)
    onSnackbar('Options sorted A–Z', async () => { setSortMode('custom'); await onReorderOptions(prev) })
  }

  async function handleSetCustom() {
    setSortMenuOpen(false)
    setSortingInProgress(true)
    setSortMode('custom')
    await new Promise(r => setTimeout(r, 500))
    setSortingInProgress(false)
  }

  /* ── Pin — temporarily hidden ───────────────────────
  async function handlePin(opt: Option) {
    if (!opt.pinned && pinnedOpts.length >= MAX_PINNED) {
      onSnackbar('Maximum 10 options can be pinned to the top'); return
    }
    const prev = [...options]
    const toggled = options.map(o => o.id === opt.id ? { ...o, pinned: !o.pinned } : o)
    const newPinned = toggled.filter(o => o.pinned)
    const newUnpinned = toggled.filter(o => !o.pinned).sort((a, b) => a.label.localeCompare(b.label))
    await onReorderOptions([...newPinned, ...newUnpinned])
    onSnackbar(
      opt.pinned ? `"${opt.label}" unpinned` : `"${opt.label}" pinned to top`,
      async () => { await onReorderOptions(prev) },
    )
  }

  // ── Drag — pinned ────────────────────────────────────
  function handlePinnedDragStart(idx: number) { pinnedDragSrc.current = idx }
  function handlePinnedDragOver(e: React.DragEvent) { e.preventDefault() }
  function handlePinnedDragLeave(_e: React.DragEvent) {}
  async function handlePinnedDrop(_e: React.DragEvent, targetIdx: number) {
    const src = pinnedDragSrc.current
    if (src === null || src === targetIdx) return
    const prev = [...options]
    const reordered = [...pinnedOpts]
    const [item] = reordered.splice(src, 1)
    reordered.splice(targetIdx, 0, item)
    pinnedDragSrc.current = null
    await onReorderOptions([...reordered, ...unpinnedOpts])
    onSnackbar(`"${item.label}" reordered`, async () => { await onReorderOptions(prev) })
  }
  function handlePinnedDragEnd() { pinnedDragSrc.current = null }
  ── end pin ─────────────────────────────────────────── */

  // ── Drag — unpinned ──────────────────────────────────
  function handleUnpinnedDragStart(idx: number) { unpinnedDragSrc.current = idx }
  function handleUnpinnedDragOver(e: React.DragEvent) { e.preventDefault() }
  function handleUnpinnedDragLeave(_e: React.DragEvent) {}
  async function handleUnpinnedDrop(_e: React.DragEvent, targetIdx: number) {
    const src = unpinnedDragSrc.current
    if (src === null || src === targetIdx) return
    const prev = [...options]
    const reordered = [...options]
    const [item] = reordered.splice(src, 1)
    reordered.splice(targetIdx, 0, item)
    unpinnedDragSrc.current = null
    await onReorderOptions(reordered)
    onSnackbar(`"${item.label}" reordered`, async () => { await onReorderOptions(prev) })
  }
  function handleUnpinnedDragEnd() { unpinnedDragSrc.current = null }

  // ── Empty state ──────────────────────────────────────
  function renderEmptyState() {
    if (options.length === 0) return (
      <div className="empty-search" style={{ padding: '32px 20px' }}>
        <div style={{ marginBottom: 6 }}>No options yet</div>
        <div style={{ fontSize: 12, color: '#bbb' }}>Use the Add field above to create your first option.</div>
      </div>
    )
    return <div className="empty-search">No options match your search</div>
  }

  // ── Row renderer ─────────────────────────────────────
  function renderRow(opt: Option, idx: number, section: 'unpinned' | 'search' | 'hidden' | 'matter-visible') {
    const canDrag = section === 'unpinned' && canDragUnpinned
    const canEdit = context === 'field'
    const canHide = context === 'matter'
    const isHid = hiddenOptIds.has(opt.id)
    const isDef = !!defaultOption && opt.label === defaultOption

    const dragHandlers = { onDragStart: handleUnpinnedDragStart, onDragOver: (e: React.DragEvent) => handleUnpinnedDragOver(e), onDragLeave: handleUnpinnedDragLeave, onDrop: handleUnpinnedDrop, onDragEnd: handleUnpinnedDragEnd }

    return (
      <OptionRow
        key={opt.id}
        option={opt}
        index={idx}
        isEditing={editingOptId === opt.id}
        highlightQuery={searchQuery}
        canDrag={canDrag}
        canEdit={canEdit}
        canHide={canHide}
        isHidden={isHid}
        isDefault={isDef}
        {...dragHandlers}
        onMerge={() => onMergeOption(opt)}
        onEdit={() => setEditingOptId(opt.id)}
        onSaveEdit={newLabel => handleSaveEdit(opt, newLabel)}
        onCancelEdit={() => setEditingOptId(null)}
        onDelete={() => setPendingDeleteOpt(opt)}
        onToggleHide={() => onToggleHide?.(opt.id)}
      />
    )
  }

  // ── Delete modal ─────────────────────────────────────
  const deleteModal = pendingDeleteOpt && (
    <div className="modal-backdrop open" onClick={() => setPendingDeleteOpt(null)}>
      <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Delete option</span>
          <button className="modal-close" onClick={() => setPendingDeleteOpt(null)}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '20px 20px 16px' }}>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            Are you sure you want to delete <strong>&ldquo;{pendingDeleteOpt.label}&rdquo;</strong>? This will remove it from any records currently using this option.
          </p>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setPendingDeleteOpt(null)}>Cancel</button>
            <button className="btn-danger" onClick={async () => {
              const opt = pendingDeleteOpt; setPendingDeleteOpt(null); await handleDelete(opt)
            }}>Delete option</button>
          </div>
        </div>
      </div>
    </div>
  )

  const hasHidden = hiddenOptIds.size > 0

  return (
    <>
      <div className="options-block">
        <div className="accordion-header">
          <div className="options-title-group">
            <span className="options-title">Options</span>
            <span className="count-badge">{options.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Customized pill — matter context, right side, when any options are hidden */}
            {context === 'matter' && hasHidden && (
              <button
                className="override-pill options-override-pill"
                type="button"
              >
                Customized
                <span
                  className="override-pill-cross"
                  onMouseEnter={e => showTip('Reset to global field settings', e)}
                  onMouseLeave={() => setTooltip(null)}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onResetHiddenOpts?.() }}
                >
                  {pillCross}
                </span>
              </button>
            )}

            {/* Sort dropdown — field context only */}
            {context === 'field' && (
              <div ref={sortMenuRef} className="sort-menu-wrap">
                <button className="sort-btn" onClick={() => setSortMenuOpen(v => !v)}>
                  {sortIcon}
                  {sortMode === 'az' ? 'A–Z' : 'Custom'}
                  {chevronDownIcon}
                </button>
                {sortMenuOpen && (
                  <div className="sort-dropdown">
                    <div className={`sort-dropdown-item${sortMode === 'az' ? ' active' : ''}`} onClick={handleSortAZ}>
                      <span style={{ width: 12, display: 'flex' }}>{sortMode === 'az' && checkIcon}</span>
                      Alphabetically A–Z
                    </div>
                    <div
                      className={`sort-dropdown-item${sortMode === 'custom' ? ' active' : ''}`}
                      onClick={handleSetCustom}
                    >
                      <span style={{ width: 12, display: 'flex' }}>{sortMode === 'custom' && checkIcon}</span>
                      Custom
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              className="accordion-toggle-btn"
              onClick={() => setOpen(o => !o)}
              type="button"
              aria-label="Toggle options"
            >
              <span className={`opts-chevron${open ? ' open' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
          </div>
        </div>

        {open && (
          <div className="options-inner">
            {/* Hidden options — shown above search, not part of the searchable list */}
            {context === 'matter' && hiddenOpts.length > 0 && (
              <div className="hidden-above-search">
                <div className="pinned-section-label hidden-section-label">Hidden options</div>
                {hiddenOpts.map((opt, i) => renderRow(opt, i, 'hidden'))}
                <div className="hidden-above-divider" />
              </div>
            )}

            <div className="opt-controls">
              <div className="opt-search-wrap">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className="opt-search-input"
                  placeholder="Search options…"
                  value={searchQuery}
                  style={searchQuery ? { paddingRight: 24 } : undefined}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="opt-search-clear" onClick={() => setSearchQuery('')} title="Clear search">×</button>
                )}
              </div>
              {context === 'field' && (
                <div className="opt-add-wrap">
                  <input
                    className="opt-add-input"
                    placeholder="Add an option…"
                    value={addInput}
                    onChange={e => setAddInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                  <button className="opt-add-btn" disabled={!addInput.trim()} onClick={handleAdd}>Add</button>
                </div>
              )}
            </div>

            <div className="opt-list-scroll">
              <div className="opt-list">
                {isSearching ? (
                  searchResults.length === 0 ? renderEmptyState()
                    : searchResults.map((opt, i) => renderRow(opt, i, 'search'))
                ) : options.length === 0 ? (
                  renderEmptyState()
                ) : context === 'matter' ? (
                  visibleOpts.length === 0
                    ? <div className="empty-search">All options are hidden</div>
                    : visibleOpts.map((opt, i) => renderRow(opt, i, 'matter-visible'))
                ) : (
                  <>
                    {/* Pinned section — temporarily hidden
                    {pinnedOpts.length > 0 && (
                      <>
                        <div className="pinned-section-label">Pinned to top</div>
                        {pinnedOpts.map((opt, i) => renderRow(opt, i, 'pinned'))}
                        {unpinnedOpts.length > 0 && (
                          <div className="pinned-divider">
                            <span className="pinned-divider-label">All options</span>
                          </div>
                        )}
                      </>
                    )}
                    */}
                    {options.map((opt, i) => renderRow(opt, i, 'unpinned'))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {mounted && deleteModal && createPortal(deleteModal, document.body)}

      {mounted && tooltip && createPortal(
        <div style={{
          position: 'fixed',
          top: tooltip.y - 8,
          left: tooltip.x,
          transform: 'translateX(-50%) translateY(-100%)',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: 11,
          padding: '4px 8px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          {tooltip.text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            border: '4px solid transparent', borderTopColor: '#1a1a1a',
          }} />
        </div>,
        document.body,
      )}

      {mounted && sortingInProgress && createPortal(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:12, padding:'28px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', minWidth:260 }}>
            <div style={{ width:28, height:28, border:'3px solid #e0e0da', borderTopColor:'var(--brand)', borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.7s linear infinite' }} />
            <div style={{ fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:6 }}>Sorting options…</div>
            <div style={{ fontSize:12, color:'#888' }}>This may take a moment for large lists.</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
