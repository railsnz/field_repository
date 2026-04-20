'use client'

import { useCallback, useEffect, useState } from 'react'
import { Field, Option, SnackbarState } from '@/types'
import PageHeader from '@/components/PageHeader'
import Toolbar from '@/components/Toolbar'
import FieldGrid from '@/components/FieldGrid'
import EditDrawer from '@/components/EditDrawer'
import CreateModal from '@/components/CreateModal'
import PreviewModal from '@/components/PreviewModal'
import MergeModal from '@/components/MergeModal'
import InfoDeleteModal from '@/components/InfoDeleteModal'
import Snackbar from '@/components/Snackbar'

const TOTAL_COUNT = 41

export default function Page() {
  const [fields, setFields] = useState<Field[]>([])
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [drawerOptions, setDrawerOptions] = useState<Option[]>([])
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [mergeOption, setMergeOption] = useState<Option | null>(null)
  const [infoDeleteMode, setInfoDeleteMode] = useState<'info' | 'delete' | null>(null)

  const activeField = fields.find(f => f.id === activeFieldId) ?? null

  // --- Data fetching ---

  async function fetchFields() {
    const res = await fetch('/api/fields')
    const data: Field[] = await res.json()
    setFields(data)
  }

  async function fetchOptions(fieldId: string) {
    const res = await fetch(`/api/fields/${fieldId}/options`)
    const data: Option[] = await res.json()
    setDrawerOptions(data)
  }

  useEffect(() => { fetchFields() }, [])

  // --- Drawer ---

  async function openDrawer(field: Field) {
    setActiveFieldId(field.id)
    await fetchOptions(field.id)
  }

  async function closeDrawer() {
    setActiveFieldId(null)
    setDrawerOptions([])
  }

  // --- Field mutations ---

  async function handleUpdateField(updates: Partial<Field>) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const updated: Field = await res.json()
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
  }

  async function handleCreateField(name: string, type: string, description: string, placeholder: string) {
    const res = await fetch('/api/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, description, placeholder, hint: description }),
    })
    const newField: Field = await res.json()
    await fetchFields()
    setShowCreate(false)
    await openDrawer(newField)
    showSnackbarMsg(`"${name}" created — add options to get started`)
  }

  async function handleDeleteField() {
    if (!activeFieldId) return
    await fetch(`/api/fields/${activeFieldId}`, { method: 'DELETE' })
    closeDrawer()
    await fetchFields()
    showSnackbarMsg('Delete field — full confirmation flow coming soon')
  }

  // --- Option mutations ---

  async function handleAddOption(label: string) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
    const opts: Option[] = await res.json()
    setDrawerOptions(opts)
  }

  async function handleDeleteOption(optId: string) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options/${optId}`, { method: 'DELETE' })
    const opts: Option[] = await res.json()
    setDrawerOptions(opts)
  }

  async function handleRenameOption(optId: string, newLabel: string) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options/${optId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel }),
    })
    await res.json()
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
    const opts: Option[] = await res.json()
    setDrawerOptions(opts)
  }

  async function handleReorderOptions(newOrder: Option[]) {
    if (!activeFieldId) return
    const res = await fetch(`/api/fields/${activeFieldId}/options`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: newOrder }),
    })
    const opts: Option[] = await res.json()
    setDrawerOptions(opts)
  }

  async function handleMergeConfirm(targetId: string, targetLabel: string) {
    if (!activeFieldId || !mergeOption) return
    const srcLabel = mergeOption.label
    const res = await fetch(`/api/fields/${activeFieldId}/options/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: mergeOption.id, targetId }),
    })
    const opts: Option[] = await res.json()
    setDrawerOptions(opts)
    setMergeOption(null)
    showSnackbarMsg(`"${srcLabel}" merged into "${targetLabel}"`)
  }

  // --- Snackbar ---

  function showSnackbarMsg(message: string, undoFn?: () => Promise<void>) {
    setSnackbar({ message, undoFn })
  }

  async function handleUndo() {
    if (snackbar?.undoFn) {
      const fn = snackbar.undoFn
      setSnackbar(null)
      await fn()
      // Re-fetch options to sync state after undo
      if (activeFieldId) await fetchOptions(activeFieldId)
    }
  }

  return (
    <>
      <div className="shell">
        <div className="content">
          <PageHeader onAddField={() => setShowCreate(true)} />
          <Toolbar totalCount={TOTAL_COUNT} />
          <FieldGrid
            fields={fields}
            activeFieldId={activeFieldId}
            onRowClick={openDrawer}
          />
        </div>

        <EditDrawer
          field={activeField}
          options={drawerOptions}
          isOpen={!!activeFieldId}
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

      <CreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreateField}
      />

      <PreviewModal
        field={activeField}
        options={drawerOptions}
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
