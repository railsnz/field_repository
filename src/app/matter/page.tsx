'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Field, Option, SnackbarState } from '@/types'
import EditDrawer from '@/components/EditDrawer'
import MergeModal from '@/components/MergeModal'
import InfoDeleteModal from '@/components/InfoDeleteModal'
import PreviewModal from '@/components/PreviewModal'
import Snackbar from '@/components/Snackbar'

// ── Static matter type data ─────────────────────────────────────────────────

const MATTER_TYPES = [
  { id: 'general',     name: 'General matter' },
  { id: 'commercial',  name: 'Commercial contracts' },
  { id: 'employment',  name: 'HR & Employment' },
  { id: 'ip',          name: 'Intellectual Property' },
  { id: 'litigation',  name: 'Litigation' },
  { id: 'property',    name: 'Real estate' },
  { id: 'regulatory',  name: 'Regulatory & compliance' },
  { id: 'corporate',   name: 'Corporate advisory' },
]

// Field names shown per matter type — Matter Jurisdiction is always first
const MATTER_FIELD_NAMES: Record<string, string[]> = {
  general:    ['Matter Jurisdiction', 'Claims', 'Communication Channels', 'Counterparties', 'External Legal Services Providers (LSP)', 'Firm Name', 'Governing law', 'HQ Location', 'Industry Category', 'Board Members'],
  commercial: ['Matter Jurisdiction', 'Counterparties', 'Governing law', 'Firm Name', 'Industry Category'],
  employment: ['Matter Jurisdiction', 'Communication Channels', 'Counterparties', 'Board Members'],
  ip:         ['Matter Jurisdiction', 'Claims', 'Governing law', 'Firm Name', 'Industry Category'],
  litigation: ['Matter Jurisdiction', 'Claims', 'Counterparties', 'External Legal Services Providers (LSP)', 'Communication Channels'],
  property:   ['Matter Jurisdiction', 'Governing law', 'HQ Location', 'Counterparties'],
  regulatory: ['Matter Jurisdiction', 'Governing law', 'Industry Category', 'Communication Channels', 'Board Members'],
  corporate:  ['Matter Jurisdiction', 'Board Members', 'Governing law', 'Counterparties', 'Firm Name', 'HQ Location'],
}

// ── Type icon map ──────────────────────────────────────────────────────────

function FieldTypeIcon({ type }: { type: string }) {
  if (type.toLowerCase().includes('multi')) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2.5" fill="white" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M13.8 13.8l1.2 1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MatterPage() {
  const [allFields, setAllFields] = useState<Field[]>([])
  // ID-based mapping resolved once on first load so renames don't break lookups
  const [matterFieldIdsByType, setMatterFieldIdsByType] = useState<Record<string, string[]>>({})
  const matterIdsInitialized = useRef(false)
  const [activeMatterTypeId, setActiveMatterTypeId] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'scoping' | 'create' | 'completion'>('details')

  // Drawer state
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [drawerOptions, setDrawerOptions] = useState<Option[]>([])
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [mergeOption, setMergeOption] = useState<Option | null>(null)
  const [infoDeleteMode, setInfoDeleteMode] = useState<'info' | 'delete' | null>(null)
  // Hidden options — key: `${subTab}:${fieldId}` so Details and Create form are independent
  const [hiddenOptsByField, setHiddenOptsByField] = useState<Map<string, Set<string>>>(new Map())
  // Snapshots of fields opened per tab (pre-edit global baseline) — key: `${subTab}:${fieldId}`
  const [editedFieldSnapshots, setEditedFieldSnapshots] = useState<Map<string, Field>>(new Map())
  // Per-tab dirty state so each tab tracks its own unsaved changes independently
  const [detailsDirty, setDetailsDirty] = useState(false)
  const [createDirty, setCreateDirty] = useState(false)

  // ── Computed per-tab helpers ───────────────────────────────────────────
  const templateDirty = activeSubTab === 'create' ? createDirty : detailsDirty
  function setTemplateDirty(val: boolean) {
    if (activeSubTab === 'create') setCreateDirty(val)
    else setDetailsDirty(val)
  }
  // Compound key: changes in one sub-tab never bleed into the other
  function tabKey(fieldId: string) { return `${activeSubTab}:${fieldId}` }
  // Derived: hidden opt IDs for the currently open field in the active tab
  const hiddenMatterOptIds = activeFieldId
    ? (hiddenOptsByField.get(tabKey(activeFieldId)) ?? new Set<string>())
    : new Set<string>()
  // Field order reordering — original order snapshot per matter type for Cancel revert
  const [originalFieldOrderByType, setOriginalFieldOrderByType] = useState<Map<string, string[]>>(new Map())
  const [fieldDragOverIdx, setFieldDragOverIdx] = useState<number | null>(null)
  const fieldDragSrc = useRef<number | null>(null)
  // ── Unsaved-changes guard ──────────────────────────────────────────────
  type PendingNav =
    | { type: 'subTab'; value: 'details' | 'scoping' | 'create' | 'completion' }
    | { type: 'matterType'; value: string }
  const [pendingNavigation, setPendingNavigation] = useState<PendingNav | null>(null)

  const activeField = allFields.find(f => f.id === activeFieldId) ?? null

  // ── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/fields').then(r => r.json()).then((fields: Field[]) => {
      setAllFields(fields)
      // Resolve names → IDs once so renaming a field doesn't break matter lookups
      if (!matterIdsInitialized.current) {
        matterIdsInitialized.current = true
        const idMap: Record<string, string[]> = {}
        for (const [typeId, names] of Object.entries(MATTER_FIELD_NAMES)) {
          idMap[typeId] = names
            .map(name => fields.find(f => f.name === name)?.id)
            .filter((id): id is string => !!id)
        }
        setMatterFieldIdsByType(idMap)
      }
    })
  }, [])

  async function fetchOptions(fieldId: string) {
    const res = await fetch(`/api/fields/${fieldId}/options`)
    const data: Option[] = await res.json()
    setDrawerOptions(data)
  }

  // ── Fields for selected matter type ───────────────────────────────────

  const matterFieldIds = matterFieldIdsByType[activeMatterTypeId] ?? []
  const matterFields = matterFieldIds
    .map(id => allFields.find(f => f.id === id))
    .filter((f): f is Field => !!f)

  const visibleFields = searchQuery
    ? matterFields.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : matterFields

  // ── Drawer ────────────────────────────────────────────────────────────

  async function openDrawer(field: Field) {
    setActiveFieldId(field.id)
    // Capture pre-edit snapshot the first time each field is opened in this tab
    const key = tabKey(field.id)
    setEditedFieldSnapshots(prev => {
      if (prev.has(key)) return prev
      const next = new Map(prev)
      next.set(key, { ...field })
      return next
    })
    await fetchOptions(field.id)
  }

  function closeDrawer() {
    setActiveFieldId(null)
    setDrawerOptions([])
  }

  function handleToggleHiddenOpt(optId: string) {
    if (!activeFieldId) return
    const opt = drawerOptions.find(o => o.id === optId)
    const key = tabKey(activeFieldId)
    const current = hiddenOptsByField.get(key) ?? new Set<string>()
    const wasHidden = current.has(optId)
    const newIds = new Set(current)
    if (wasHidden) newIds.delete(optId)
    else newIds.add(optId)
    const prevIds = new Set(current)
    setHiddenOptsByField(prev => { const m = new Map(prev); m.set(key, newIds); return m })
    setTemplateDirty(true)
    if (wasHidden) {
      showSnackbarMsg(`"${opt?.label ?? 'Option'}" is now available`)
    } else {
      showSnackbarMsg(
        `"${opt?.label ?? 'Option'}" hidden from this matter type`,
        async () => setHiddenOptsByField(prev => { const m = new Map(prev); m.set(key, prevIds); return m }),
      )
    }
  }

  function handleResetHiddenOpts() {
    if (!activeFieldId) return
    const key = tabKey(activeFieldId)
    setHiddenOptsByField(prev => { const m = new Map(prev); m.set(key, new Set()); return m })
    setTemplateDirty(true)
    showSnackbarMsg('Options reset to global')
  }

  // ── Field row drag-and-drop ────────────────────────────────────────────

  function handleFieldDragStart(idx: number) {
    fieldDragSrc.current = idx
  }

  function handleFieldDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setFieldDragOverIdx(idx)
  }

  function handleFieldDragLeave() {
    setFieldDragOverIdx(null)
  }

  function handleFieldDrop(e: React.DragEvent, targetIdx: number) {
    setFieldDragOverIdx(null)
    const src = fieldDragSrc.current
    if (src === null || src === targetIdx) return
    fieldDragSrc.current = null
    const currentIds = matterFieldIdsByType[activeMatterTypeId] ?? []
    // Capture original order before the first drag in this session
    setOriginalFieldOrderByType(prev => {
      if (prev.has(activeMatterTypeId)) return prev
      const next = new Map(prev)
      next.set(activeMatterTypeId, [...currentIds])
      return next
    })
    const reordered = [...currentIds]
    const [item] = reordered.splice(src, 1)
    reordered.splice(targetIdx, 0, item)
    setMatterFieldIdsByType(prev => ({ ...prev, [activeMatterTypeId]: reordered }))
    setTemplateDirty(true)
  }

  function handleFieldDragEnd() {
    fieldDragSrc.current = null
    setFieldDragOverIdx(null)
  }

  // ── Field mutations (same as Field Management) ─────────────────────────

  async function handleUpdateField(updates: Partial<Field>) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const updated: Field = await res.json()
    setAllFields(prev => prev.map(f => f.id === updated.id ? updated : f))
    setTemplateDirty(true)
  }

  async function handleDeleteField() {
    if (!activeFieldId) return
    await fetch(`/api/fields/${activeFieldId}`, { method: 'DELETE' })
    closeDrawer()
    const res = await fetch('/api/fields')
    setAllFields(await res.json())
    showSnackbarMsg('Field removed from matter template')
  }

  // ── Option mutations ───────────────────────────────────────────────────

  async function handleAddOption(label: string) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
    setDrawerOptions(await res.json())
  }

  async function handleDeleteOption(optId: string) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options/${optId}`, { method: 'DELETE' })
    setDrawerOptions(await res.json())
  }

  async function handleRenameOption(optId: string, newLabel: string) {
    if (!activeFieldId) return
    await fetch(`/api/fields/${activeFieldId}/options/${optId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel }),
    })
    await fetchOptions(activeFieldId)
  }

  async function handleSortOptions() {
    if (!activeFieldId) return
    const sorted = [...drawerOptions].sort((a, b) => a.label.localeCompare(b.label))
    const res = await fetch(`/api/fields/${activeFieldId}/options`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: sorted }),
    })
    setDrawerOptions(await res.json())
  }

  async function handleReorderOptions(newOrder: Option[]) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: newOrder }),
    })
    setDrawerOptions(await res.json())
  }

  async function handleMergeConfirm(targetId: string, targetLabel: string) {
    if (!activeFieldId || !mergeOption) return
    const srcLabel = mergeOption.label
    const res = await fetch(`/api/fields/${activeFieldId}/options/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: mergeOption.id, targetId }),
    })
    setDrawerOptions(await res.json())
    setMergeOption(null)
    showSnackbarMsg(`"${srcLabel}" merged into "${targetLabel}"`)
  }

  // ── Snackbar ──────────────────────────────────────────────────────────

  function showSnackbarMsg(message: string, undoFn?: () => Promise<void>) {
    setSnackbar({ message, undoFn })
  }

  async function handleUndo() {
    if (snackbar?.undoFn) {
      const fn = snackbar.undoFn
      setSnackbar(null)
      await fn()
      if (activeFieldId) await fetchOptions(activeFieldId)
    }
  }

  // ── Template save / cancel ────────────────────────────────────────────

  async function handleSaveTemplate() {
    // Keep editedFieldSnapshots — they remain the global baseline for Customized pills
    setTemplateDirty(false)
    showSnackbarMsg('Template saved')
  }

  async function handleCancelTemplate() {
    // Only revert the current tab's changes
    const prefix = `${activeSubTab}:`
    let hadChanges = false
    for (const [key, snapshot] of editedFieldSnapshots) {
      if (!key.startsWith(prefix)) continue
      hadChanges = true
      const fieldId = key.slice(prefix.length)
      await fetch(`/api/fields/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: snapshot.name,
          description: snapshot.description,
          placeholder: snapshot.placeholder,
          defaultOption: snapshot.defaultOption,
        }),
      })
    }
    if (hadChanges) {
      const res = await fetch('/api/fields')
      setAllFields(await res.json())
    }
    // Clear hidden opts for this tab's fields only
    setHiddenOptsByField(prev => {
      const m = new Map(prev)
      for (const key of [...m.keys()]) { if (key.startsWith(prefix)) m.delete(key) }
      return m
    })
    // Clear snapshots for this tab only
    setEditedFieldSnapshots(prev => {
      const m = new Map(prev)
      for (const key of [...m.keys()]) { if (key.startsWith(prefix)) m.delete(key) }
      return m
    })
    // Field ordering is Details-tab only — revert if we're discarding Details
    if (activeSubTab === 'details' && originalFieldOrderByType.size > 0) {
      setMatterFieldIdsByType(prev => {
        const next = { ...prev }
        for (const [typeId, originalIds] of originalFieldOrderByType) {
          next[typeId] = originalIds
        }
        return next
      })
      setOriginalFieldOrderByType(new Map())
    }
    setTemplateDirty(false)
    closeDrawer()
    showSnackbarMsg('Changes discarded')
  }

  // ── Navigation guard helpers ───────────────────────────────────────────

  function executeNav(nav: PendingNav) {
    if (nav.type === 'subTab') {
      setActiveSubTab(nav.value)
      if (nav.value !== 'details') closeDrawer()
    } else {
      // Switching matter type — clear ALL tab state to start a fresh session
      setActiveMatterTypeId(nav.value)
      setSearchQuery('')
      setDetailsDirty(false)
      setCreateDirty(false)
      setEditedFieldSnapshots(new Map())
      setHiddenOptsByField(new Map())
      setOriginalFieldOrderByType(new Map())
      closeDrawer()
    }
    setPendingNavigation(null)
  }

  function handleRequestNav(nav: PendingNav) {
    if (nav.type === 'subTab' && nav.value === activeSubTab) return
    if (nav.type === 'matterType' && nav.value === activeMatterTypeId) return
    // For matter type switch, guard against either tab being dirty
    const isDirty = nav.type === 'matterType' ? (detailsDirty || createDirty) : templateDirty
    if (isDirty) {
      setPendingNavigation(nav)
      return
    }
    executeNav(nav)
  }

  // ── Fields with pending changes for the active tab only ───────────────
  const fieldsWithPendingChanges = useMemo(() => {
    if (!templateDirty) return new Set<string>()
    const prefix = `${activeSubTab}:`
    const result = new Set<string>()
    // Hidden options — only count keys for the active tab
    for (const [key, hiddenIds] of hiddenOptsByField) {
      if (!key.startsWith(prefix)) continue
      if (hiddenIds.size > 0) result.add(key.slice(prefix.length))
    }
    // Field config changes vs snapshot — only the active tab's snapshots
    for (const [key, snapshot] of editedFieldSnapshots) {
      if (!key.startsWith(prefix)) continue
      const fieldId = key.slice(prefix.length)
      const current = allFields.find(f => f.id === fieldId)
      if (current && (
        current.description !== snapshot.description ||
        current.placeholder !== snapshot.placeholder ||
        current.defaultOption !== snapshot.defaultOption
      )) result.add(fieldId)
    }
    return result
  }, [templateDirty, hiddenOptsByField, editedFieldSnapshots, allFields, activeSubTab])

  // ── Sub-tab badge counts ───────────────────────────────────────────────
  const detailsCount = matterFields.length

  return (
    <>
      <div className="matter-page">
        {/* ── Left sidebar ─────────────────────────────────── */}
        <aside className="matter-sidebar">
          <div className="matter-sidebar-top">
            <button className="matter-new-btn">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              New matter type
            </button>
          </div>
          <div className="matter-type-list">
            {MATTER_TYPES.map(mt => (
              <div
                key={mt.id}
                className={`matter-type-item${activeMatterTypeId === mt.id ? ' active' : ''}`}
                onClick={() => handleRequestNav({ type: 'matterType', value: mt.id })}
              >
                {mt.name}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <div className="matter-main">
          <div className="matter-main-header">
            <h2>{MATTER_TYPES.find(m => m.id === activeMatterTypeId)?.name}</h2>
          </div>

          {/* Sub-tabs */}
          <div className="matter-sub-tabs">
            <div
              className={`matter-sub-tab${activeSubTab === 'details' ? ' active' : ''}`}
              onClick={() => handleRequestNav({ type: 'subTab', value: 'details' })}
            >
              Matter details
              <span className="sub-tab-badge">{detailsCount}</span>
            </div>
            <div className="matter-sub-tab inactive">
              Scoping fields
              <span className="sub-tab-badge" style={{ background: '#c8c8c4' }}>0</span>
            </div>
            <div
              className={`matter-sub-tab${activeSubTab === 'create' ? ' active' : ''}`}
              onClick={() => handleRequestNav({ type: 'subTab', value: 'create' })}
            >
              Create form
              <span className="sub-tab-badge">1</span>
            </div>
            <div className="matter-sub-tab inactive">
              Completion form
              <span className="sub-tab-badge" style={{ background: '#c8c8c4' }}>0</span>
            </div>
          </div>

          {activeSubTab === 'details' || activeSubTab === 'create' ? (
            <>
              {/* Save/Cancel row — only when dirty */}
              {templateDirty && (
                <div className="template-save-bar">
                  <span className="template-save-label">You have unsaved changes to this tab</span>
                  <button className="btn-ghost template-action-btn" onClick={handleCancelTemplate}>Cancel</button>
                  <button className="btn-primary template-action-btn" onClick={handleSaveTemplate}>Save</button>
                </div>
              )}

              {/* Toolbar: search + Add + Preview */}
              <div className="matter-search-bar">
                <div className="matter-search-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="matter-search-input"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="matter-toolbar-actions">
                  <button className="btn-primary template-action-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add
                  </button>
                  <button className="btn-ghost template-action-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                    </svg>
                    Preview
                  </button>
                </div>
              </div>

              {/* Tab content */}
              {activeSubTab === 'details' ? (
                <div className="matter-table-wrap">
                  <div className="matter-table-head">
                    <span />
                    <span />
                    <span>Field name</span>
                    <span>Field type</span>
                  </div>
                  {visibleFields.map((field, idx) => {
                    const canDrag = !searchQuery
                    return (
                      <div
                        key={field.id}
                        className={`matter-table-row${field.id === activeFieldId ? ' active-row' : ''}${fieldDragOverIdx === idx ? ' field-drag-over' : ''}`}
                        draggable={canDrag}
                        onDragStart={canDrag ? () => handleFieldDragStart(idx) : undefined}
                        onDragOver={canDrag ? e => handleFieldDragOver(e, idx) : undefined}
                        onDragLeave={canDrag ? handleFieldDragLeave : undefined}
                        onDrop={canDrag ? e => handleFieldDrop(e, idx) : undefined}
                        onDragEnd={canDrag ? handleFieldDragEnd : undefined}
                        onClick={() => openDrawer(field)}
                      >
                        <span className={`matter-row-drag-handle${canDrag ? '' : ' hidden'}`}>
                          <svg width="10" height="14" viewBox="0 0 10 16" fill="none">
                            <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                            <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
                            <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                            <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
                          </svg>
                        </span>
                        <input type="checkbox" className="matter-row-checkbox" onClick={e => e.stopPropagation()} readOnly />
                        <span className="matter-field-name">
                          {field.name}
                          {fieldsWithPendingChanges.has(field.id) && (
                            <span className="pending-pill">Changes pending</span>
                          )}
                        </span>
                        <span className="matter-field-type">
                          <span className="matter-type-icon"><FieldTypeIcon type={field.type} /></span>
                          {field.type}
                        </span>
                      </div>
                    )
                  })}
                  {visibleFields.length === 0 && (
                    <div style={{ padding: '40px 28px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>
                      {searchQuery ? 'No fields match your search' : 'No fields in this matter type'}
                    </div>
                  )}
                </div>
              ) : (
                (() => {
                  const mjId = (matterFieldIdsByType[activeMatterTypeId] ?? [])[0]
                  const mjField = mjId ? allFields.find(f => f.id === mjId) : undefined
                  return (
                    <div className="matter-table-wrap">
                      <div className="matter-table-head">
                        <span />
                        <span />
                        <span>Field name</span>
                        <span>Field type</span>
                      </div>
                      {mjField && (
                        <div
                          className={`matter-table-row${activeFieldId === mjField.id ? ' active-row' : ''}`}
                          onClick={() => openDrawer(mjField)}
                        >
                          <span />
                          <input type="checkbox" className="matter-row-checkbox" onClick={e => e.stopPropagation()} readOnly />
                          <span className="matter-field-name">
                            {mjField.name}
                            {fieldsWithPendingChanges.has(mjField.id) && (
                              <span className="pending-pill">Changes pending</span>
                            )}
                          </span>
                          <span className="matter-field-type">
                            <span className="matter-type-icon"><FieldTypeIcon type={mjField.type} /></span>
                            {mjField.type}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })()
              )}
            </>
          ) : (
            <div className="matter-coming-soon">This tab is not available in this prototype.</div>
          )}
        </div>

        {/* ── Edit Drawer (reused) ──────────────────────────── */}
        <EditDrawer
          field={activeField}
          globalField={activeFieldId ? editedFieldSnapshots.get(tabKey(activeFieldId)) : undefined}
          options={drawerOptions}
          isOpen={!!activeFieldId}
          context="matter"
          contextLabel={`${MATTER_TYPES.find(m => m.id === activeMatterTypeId)?.name} • ${activeSubTab === 'create' ? 'Create form' : 'Matter details'}`}
          hiddenMatterOptIds={hiddenMatterOptIds}
          showCreateAlias={activeSubTab === 'create'}
          onToggleHiddenOpt={handleToggleHiddenOpt}
          onResetHiddenOpts={handleResetHiddenOpts}
          onClose={closeDrawer}
          onUpdateField={handleUpdateField}
          onAddOption={handleAddOption}
          onDeleteOption={handleDeleteOption}
          onRenameOption={handleRenameOption}
          onSortOptions={handleSortOptions}
          onReorderOptions={handleReorderOptions}
          onMergeOption={setMergeOption}
          onOpenPreview={() => setShowPreview(true)}
          onOpenInfoDelete={setInfoDeleteMode}
          onSnackbar={showSnackbarMsg}
        />
      </div>

      <PreviewModal
        field={activeField}
        options={drawerOptions.filter(o => !hiddenMatterOptIds.has(o.id))}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
      <MergeModal
        sourceOption={mergeOption}
        allOptions={drawerOptions}
        onConfirm={handleMergeConfirm}
        onClose={() => setMergeOption(null)}
      />
      <InfoDeleteModal
        mode={infoDeleteMode}
        field={activeField}
        options={drawerOptions}
        onDelete={handleDeleteField}
        onClose={() => setInfoDeleteMode(null)}
      />
      <Snackbar
        snackbar={snackbar}
        onUndo={handleUndo}
        onDismiss={() => setSnackbar(null)}
      />

      {/* ── Unsaved changes guard modal ─────────────────── */}
      {pendingNavigation && (
        <div className="modal-backdrop open" onClick={() => setPendingNavigation(null)}>
          <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Unsaved changes</span>
              <button className="modal-close" onClick={() => setPendingNavigation(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc" style={{ marginBottom: 0 }}>
                You have unsaved changes to this tab. Save them before leaving, or discard them.
              </p>
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px 20px', gap: 8 }}>
              <button
                className="btn-ghost template-action-btn"
                style={{ marginRight: 'auto' }}
                onClick={() => setPendingNavigation(null)}
              >
                Cancel
              </button>
              <button
                className="btn-ghost template-action-btn"
                style={{ color: '#d93025', borderColor: '#fad2cf' }}
                onClick={async () => {
                  const nav = pendingNavigation
                  await handleCancelTemplate()
                  executeNav(nav)
                }}
              >
                Discard changes
              </button>
              <button
                className="btn-primary template-action-btn"
                onClick={async () => {
                  const nav = pendingNavigation
                  await handleSaveTemplate()
                  executeNav(nav)
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
