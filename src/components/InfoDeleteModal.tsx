'use client'

import { Field, Option } from '@/types'

interface InfoDeleteModalProps {
  mode: 'info' | 'delete' | null
  field: Field | null
  options: Option[]
  onDelete: () => void
  onClose: () => void
}

export default function InfoDeleteModal({ mode, field, options, onDelete, onClose }: InfoDeleteModalProps) {
  const isOpen = !!mode

  return (
    <div
      className={`modal-backdrop${isOpen ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {mode === 'info' ? 'Field info' : 'Delete field'}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: '24px 20px', color: '#666', fontSize: 13, lineHeight: 1.6 }}>
          {mode === 'info' && field && (
            <>
              <p style={{ marginBottom: 12 }}><strong>Field name:</strong> {field.name}</p>
              <p style={{ marginBottom: 12 }}><strong>Type:</strong> {field.type}</p>
              <p style={{ marginBottom: 12 }}><strong>Options:</strong> {options.length}</p>
              <p style={{ color: '#aaa', fontSize: 12 }}>Usage stats, assignment history and audit log will appear here.</p>
            </>
          )}
          {mode === 'delete' && field && (
            <>
              <p style={{ marginBottom: 16 }}>
                Deleting <strong>{field.name}</strong> will remove it from all matter types it is currently assigned to. Existing data on records will be preserved but the field will no longer be editable.
              </p>
              <p style={{ color: '#A32D2D', fontSize: 12, marginBottom: 20 }}>
                This action requires confirmation and cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn-danger" onClick={() => { onClose(); onDelete() }}>Delete field</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
