'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  // Hidden options stored per field so they persist across open/close
  const [hiddenOptsByField, setHiddenOptsByField] = useState<Map<string, Set<string>>>(new Map())
  // Derived: hidden opt IDs for the currently open field
  const hiddenMatterOptIds = activeFieldId ? (hiddenOptsByField.get(activeFieldId) ?? new Set<string>()) : new Set<string>()
  // Template dirty state — tracks unsaved template changes
  const [templateDirty, setTemplateDirty] = useState(false)
  // Snapshots of every field opened during the current dirty session (pre-edit state)
  const [editedFieldSnapshots, setEditedFieldSnapshots] = useState<Map<string, Field>>(new Map())

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
    // Capture pre-edit snapshot the first time each field is opened this session
    setEditedFieldSnapshots(prev => {
      if (prev.has(field.id)) return prev
      const next = new Map(prev)
      next.set(field.id, { ...field })
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
    const current = hiddenOptsByField.get(activeFieldId) ?? new Set<string>()
    const wasHidden = current.has(optId)
    const newIds = new Set(current)
    if (wasHidden) newIds.delete(optId)
    else newIds.add(optId)
    const prevIds = new Set(current)
    setHiddenOptsByField(prev => { const m = new Map(prev); m.set(activeFieldId, newIds); return m })
    setTemplateDirty(true)
    if (wasHidden) {
      showSnackbarMsg(`"${opt?.label ?? 'Option'}" is now available`)
    } else {
      showSnackbarMsg(
        `"${opt?.label ?? 'Option'}" hidden from this matter type`,
        async () => setHiddenOptsByField(prev => { const m = new Map(prev); m.set(activeFieldId, prevIds); return m }),
      )
    }
  }

  function handleResetHiddenOpts() {
    if (!activeFieldId) return
    setHiddenOptsByField(prev => { const m = new Map(prev); m.set(activeFieldId, new Set()); return m })
    setTemplateDirty(true)
    showSnackbarMsg('Options reset to global')
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
    setTemplateDirty(false)
    setEditedFieldSnapshots(new Map())
    showSnackbarMsg('Template saved')
  }

  async function handleCancelTemplate() {
    // Revert every field edited during this session back to its pre-edit state
    for (const [fieldId, snapshot] of editedFieldSnapshots) {
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
    if (editedFieldSnapshots.size > 0) {
      const res = await fetch('/api/fields')
      setAllFields(await res.json())
    }
    // Clear hidden opts for all fields edited this session
    setHiddenOptsByField(prev => {
      const m = new Map(prev)
      for (const fieldId of editedFieldSnapshots.keys()) m.delete(fieldId)
      return m
    })
    setTemplateDirty(false)
    setEditedFieldSnapshots(new Map())
    closeDrawer()
    showSnackbarMsg('Changes discarded')
  }

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
                onClick={() => {
                  setActiveMatterTypeId(mt.id)
                  setSearchQuery('')
                  setTemplateDirty(false)
                  setEditedFieldSnapshots(new Map())
                  setHiddenOptsByField(new Map())
                  closeDrawer()
                }}
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
              onClick={() => setActiveSubTab('details')}
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
              onClick={() => { setActiveSubTab('create'); closeDrawer() }}
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
                    <span>Field name</span>
                    <span>Field type</span>
                  </div>
                  {visibleFields.map(field => (
                    <div
                      key={field.id}
                      className={`matter-table-row${field.id === activeFieldId ? ' active-row' : ''}`}
                      onClick={() => openDrawer(field)}
                    >
                      <input type="checkbox" className="matter-row-checkbox" onClick={e => e.stopPropagation()} readOnly />
                      <span className="matter-field-name">{field.name}</span>
                      <span className="matter-field-type">
                        <span className="matter-type-icon"><FieldTypeIcon type={field.type} /></span>
                        {field.type}
                      </span>
                    </div>
                  ))}
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
                        <span>Field name</span>
                        <span>Field type</span>
                      </div>
                      {mjField && (
                        <div
                          className={`matter-table-row${activeFieldId === mjField.id ? ' active-row' : ''}`}
                          onClick={() => openDrawer(mjField)}
                        >
                          <input type="checkbox" className="matter-row-checkbox" onClick={e => e.stopPropagation()} readOnly />
                          <span className="matter-field-name">{mjField.name}</span>
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
    </>
  )
}
