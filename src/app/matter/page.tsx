'use client'

import { useCallback, useEffect, useState } from 'react'
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
  // Matter-context hidden options (per open drawer session)
  const [hiddenMatterOptIds, setHiddenMatterOptIds] = useState<Set<string>>(new Set())

  const activeField = allFields.find(f => f.id === activeFieldId) ?? null

  // ── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/fields').then(r => r.json()).then(setAllFields)
  }, [])

  async function fetchOptions(fieldId: string) {
    const res = await fetch(`/api/fields/${fieldId}/options`)
    const data: Option[] = await res.json()
    setDrawerOptions(data)
  }

  // ── Fields for selected matter type ───────────────────────────────────

  const matterFieldNames = MATTER_FIELD_NAMES[activeMatterTypeId] ?? []
  const matterFields = matterFieldNames
    .map(name => allFields.find(f => f.name === name))
    .filter((f): f is Field => !!f)

  const visibleFields = searchQuery
    ? matterFields.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : matterFields

  // ── Drawer ────────────────────────────────────────────────────────────

  async function openDrawer(field: Field) {
    setActiveFieldId(field.id)
    setHiddenMatterOptIds(new Set())
    await fetchOptions(field.id)
  }

  function closeDrawer() {
    setActiveFieldId(null)
    setDrawerOptions([])
    setHiddenMatterOptIds(new Set())
  }

  function handleToggleHiddenOpt(optId: string) {
    const opt = drawerOptions.find(o => o.id === optId)
    const wasHidden = hiddenMatterOptIds.has(optId)
    const newIds = new Set(hiddenMatterOptIds)
    if (wasHidden) newIds.delete(optId)
    else newIds.add(optId)
    const prevIds = new Set(hiddenMatterOptIds)
    setHiddenMatterOptIds(newIds)
    if (wasHidden) {
      showSnackbarMsg(`"${opt?.label ?? 'Option'}" is now available`)
    } else {
      showSnackbarMsg(
        `"${opt?.label ?? 'Option'}" hidden from this matter type`,
        async () => setHiddenMatterOptIds(prevIds),
      )
    }
  }

  function handleResetHiddenOpts() {
    setHiddenMatterOptIds(new Set())
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

          {activeSubTab === 'create' ? (
            (() => {
              const mjField = allFields.find(f => f.name === 'Matter Jurisdiction')
              return (
                <div className="create-form-preview">
                  <div className="create-form-preview-hint">
                    Click a field to customise how it appears on the create form for this matter type.
                  </div>
                  {mjField && (
                    <div
                      className={`create-form-preview-row${activeFieldId === mjField.id ? ' active-row' : ''}`}
                      onClick={() => openDrawer(mjField)}
                    >
                      <label className="create-form-preview-label">
                        Matter Jurisdiction
                        <span className="create-form-preview-required">*</span>
                      </label>
                      <div className="create-form-preview-input">Select a jurisdiction…</div>
                    </div>
                  )}
                </div>
              )
            })()
          ) : activeSubTab === 'details' ? (
            <>
              {/* Search */}
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
              </div>

              {/* Table */}
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
                    <input
                      type="checkbox"
                      className="matter-row-checkbox"
                      onClick={e => e.stopPropagation()}
                      readOnly
                    />
                    <span className="matter-field-name">{field.name}</span>
                    <span className="matter-field-type">
                      <span className="matter-type-icon">
                        <FieldTypeIcon type={field.type} />
                      </span>
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
          contextLabel={MATTER_TYPES.find(m => m.id === activeMatterTypeId)?.name}
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
