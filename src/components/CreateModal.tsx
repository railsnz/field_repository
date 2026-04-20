'use client'

import { useEffect, useRef, useState } from 'react'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, type: string, description: string, placeholder: string) => Promise<void>
}

const FIELD_TYPES = [
  { group: 1, type: 'Single line text', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M2 8h8M2 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 1, type: 'Paragraph text', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 7h12M2 10h12M2 13h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 1, type: 'Number', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3l-2 10M10 3l-2 10M3 6h10M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 1, type: 'Currency', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v6M6.5 6.5h2a1 1 0 010 2h-1a1 1 0 000 2H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 1, type: 'Datepicker', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 2, type: 'Dropdown', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { group: 2, type: 'Lookup', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="12" cy="12" r="2.5" fill="white" stroke="currentColor" strokeWidth="1.3"/><path d="M13.8 13.8l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 2, type: 'Lookup (multi)', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 3, type: 'Person', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 3, type: 'Single checkbox', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { group: 3, type: 'Checkbox list', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="2" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5h6M8 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 3, type: 'Radio button list', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/><circle cx="4" cy="5" r="0.8" fill="currentColor"/><circle cx="4" cy="11" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5h6M8 11h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { group: 3, type: 'Slider', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="6" cy="5" r="2" fill="white" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="11" r="2" fill="white" stroke="currentColor" strokeWidth="1.3"/></svg> },
]

export default function CreateModal({ isOpen, onClose, onSave }: CreateModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [nameError, setNameError] = useState(false)
  const [footerError, setFooterError] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null)
      setName('')
      setDesc('')
      setPlaceholder('')
      setNameError(false)
      setFooterError(false)
    }
  }, [isOpen])

  function handleSelectType(type: string) {
    setSelectedType(type)
    if (type === 'Lookup') {
      setTimeout(() => nameRef.current?.focus(), 40)
    }
  }

  function handleNameChange(val: string) {
    setName(val)
    if (val.trim()) {
      setNameError(false)
      setFooterError(false)
    }
  }

  async function handleSave() {
    if (!selectedType) return
    if (!name.trim()) {
      setNameError(true)
      setFooterError(true)
      nameRef.current?.focus()
      return
    }
    await onSave(name.trim(), selectedType, desc.trim(), placeholder.trim())
  }

  let prevGroup = 0
  const groups = FIELD_TYPES.map(ft => {
    const showDivider = ft.group !== prevGroup && prevGroup !== 0
    prevGroup = ft.group
    return { ...ft, showDivider }
  })

  return (
    <div
      className={`modal-backdrop${isOpen ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal create-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '20px 24px 0', borderBottom: 'none' }}>
          <span className="modal-title" style={{ fontSize: 18, fontWeight: 600 }}>Create a custom field</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="create-body">
          <div className="create-sidebar">
            {groups.map(({ type, icon, showDivider }) => (
              <div key={type}>
                {showDivider && <div className="ft-divider" />}
                <div
                  className={`ft-item${selectedType === type ? ' active' : ''}`}
                  onClick={() => handleSelectType(type)}
                >
                  {icon}
                  {type}
                </div>
              </div>
            ))}
          </div>

          <div className="create-main">
            {!selectedType && (
              <div className="create-empty">
                <div className="create-empty-arrow">←</div>
                <h3>Start by selecting a field type on the left</h3>
                <p>Once you've selected one of the field types, you will be able to customise and save into your library for use across the system.</p>
              </div>
            )}

            {selectedType && selectedType !== 'Lookup' && (
              <div className="create-empty">
                <div style={{ fontSize: 40, color: '#e0e0da' }}>⊘</div>
                <h3>{selectedType}</h3>
                <p>This field type is not available in this prototype. Select <strong style={{ color: 'var(--brand)' }}>Lookup</strong> to continue.</p>
              </div>
            )}

            {selectedType === 'Lookup' && (
              <div className="create-config">
                <h3>Lookup field</h3>

                <div className="create-form-row">
                  <span className="create-form-label">
                    Field name <span className="required-star">*</span>
                  </span>
                  <div className="name-wrap">
                    <input
                      ref={nameRef}
                      className={`create-form-input${nameError ? ' error' : ''}`}
                      placeholder="e.g. Matter Jurisdiction"
                      value={name}
                      onChange={e => handleNameChange(e.target.value)}
                      autoComplete="off"
                    />
                    {nameError && <span className="name-error">Field name is required</span>}
                  </div>
                </div>

                <div className="create-form-row">
                  <span className="create-form-label">Description</span>
                  <textarea
                    className="create-form-textarea"
                    placeholder="Describe what this field is used for…"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                  />
                </div>

                <div className="create-form-row">
                  <span className="create-form-label">Placeholder text</span>
                  <input
                    className="create-form-input"
                    placeholder="e.g. Select a jurisdiction…"
                    value={placeholder}
                    onChange={e => setPlaceholder(e.target.value)}
                  />
                </div>

                <div className="create-form-row">
                  <span className="create-form-label">Default option</span>
                  <div className="disabled-input-wrap">
                    <input className="disabled-input" disabled placeholder="No options yet" />
                    <div className="disabled-tooltip">You can set a default option after creating the field and adding options to it.</div>
                  </div>
                </div>

                <div className="options-notice">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Options for this lookup field can be added after the field is created. You&apos;ll be taken straight to the field editor when you save.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="create-footer">
          {footerError && (
            <span className="footer-error">Please enter a field name to continue.</span>
          )}
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Create Field</button>
        </div>
      </div>
    </div>
  )
}
