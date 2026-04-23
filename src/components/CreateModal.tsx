'use client'

import { useEffect, useRef, useState } from 'react'

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, type: string, description: string, placeholder: string) => Promise<void>
}

const FIELD_GROUPS = [
  {
    label: 'Selection',
    types: [
      { type: 'Radio list', icon: <svg width="13" height="13" viewBox="0 0 32 32" fill="currentColor"><path d="M30 15.9688C30 10.9688 27.3125 6.40625 23 3.90625C18.625 1.34375 13.3125 1.34375 9 3.90625C4.625 6.40625 2 10.9688 2 15.9688C2 21.0312 4.625 25.5938 9 28.0938C13.3125 30.6562 18.625 30.6562 23 28.0938C27.3125 25.5938 30 21.0312 30 15.9688ZM0 15.9688C0 10.2812 3 5.03125 8 2.15625C12.9375 -0.71875 19 -0.71875 24 2.15625C28.9375 5.03125 32 10.2812 32 15.9688C32 21.7188 28.9375 26.9688 24 29.8438C19 32.7188 12.9375 32.7188 8 29.8438C3 26.9688 0 21.7188 0 15.9688ZM20 15.9688C20 14.5938 19.1875 13.2812 18 12.5312C16.75 11.8438 15.1875 11.8438 14 12.5312C12.75 13.2812 12 14.5938 12 15.9688C12 17.4062 12.75 18.7188 14 19.4688C15.1875 20.1562 16.75 20.1562 18 19.4688C19.1875 18.7188 20 17.4062 20 15.9688ZM10 15.9688C10 13.8438 11.125 11.9062 13 10.7812C14.8125 9.71875 17.125 9.71875 19 10.7812C20.8125 11.9062 22 13.8438 22 15.9688C22 18.1562 20.8125 20.0938 19 21.2188C17.125 22.2812 14.8125 22.2812 13 21.2188C11.125 20.0938 10 18.1562 10 15.9688Z"/></svg> },
      { type: 'Checkbox list', icon: <svg width="13" height="13" viewBox="0 0 33 26" fill="currentColor"><path d="M9.78125 1.65821L4.78125 7.65821C4.59375 7.84571 4.34375 7.97071 4.03125 7.97071C3.78125 8.03321 3.46875 7.90821 3.28125 7.72071L0.28125 4.72071C-0.09375 4.34571 -0.09375 3.65821 0.28125 3.28321C0.65625 2.90821 1.34375 2.90821 1.71875 3.28321L3.90625 5.53321L8.21875 0.345712C8.59375 -0.0917877 9.21875 -0.0917877 9.65625 0.220712C10.0938 0.595712 10.1562 1.22071 9.78125 1.65821ZM9.78125 11.6582L4.78125 17.6582C4.59375 17.8457 4.34375 17.9707 4.03125 17.9707C3.78125 18.0332 3.46875 17.9082 3.28125 17.7207L0.28125 14.7207C-0.09375 14.3457 -0.09375 13.6582 0.28125 13.2832C0.65625 12.9082 1.34375 12.9082 1.71875 13.2832L3.90625 15.5332L8.21875 10.3457C8.59375 9.90821 9.21875 9.90821 9.65625 10.2207C10.0938 10.5957 10.1562 11.2207 9.78125 11.6582ZM12.0312 3.97071C12.0312 3.47071 12.4688 2.97071 13.0312 2.97071H31.0312C31.5312 2.97071 32.0312 3.47071 32.0312 3.97071C32.0312 4.53321 31.5312 4.97071 31.0312 4.97071H13.0312C12.4688 4.97071 12.0312 4.53321 12.0312 3.97071ZM12.0312 13.9707C12.0312 13.4707 12.4688 12.9707 13.0312 12.9707H31.0312C31.5312 12.9707 32.0312 13.4707 32.0312 13.9707C32.0312 14.5332 31.5312 14.9707 31.0312 14.9707H13.0312C12.4688 14.9707 12.0312 14.5332 12.0312 13.9707ZM10.0312 23.9707C10.0312 23.4707 10.4688 22.9707 11.0312 22.9707H31.0312C31.5312 22.9707 32.0312 23.4707 32.0312 23.9707C32.0312 24.5332 31.5312 24.9707 31.0312 24.9707H11.0312C10.4688 24.9707 10.0312 24.5332 10.0312 23.9707ZM6.03125 23.9707C6.03125 25.0957 5.09375 25.9707 4.03125 25.9707C2.90625 25.9707 2.03125 25.0957 2.03125 23.9707C2.03125 22.9082 2.90625 21.9707 4.03125 21.9707C5.09375 21.9707 6.03125 22.9082 6.03125 23.9707Z"/></svg> },
      { type: 'Single select', icon: <svg width="13" height="13" viewBox="0 0 32 32" fill="currentColor"><path d="M16.0312 30C21.0312 30 25.5938 27.375 28.0938 23C30.6562 18.6875 30.6562 13.375 28.0938 9C25.5938 4.6875 21.0312 2 16.0312 2C10.9688 2 6.40625 4.6875 3.90625 9C1.34375 13.375 1.34375 18.6875 3.90625 23C6.40625 27.375 10.9688 30 16.0312 30ZM16.0312 0C21.7188 0 26.9688 3.0625 29.8438 8C32.7188 13 32.7188 19.0625 29.8438 24C26.9688 29 21.7188 32 16.0312 32C10.2812 32 5.03125 29 2.15625 24C-0.71875 19.0625 -0.71875 13 2.15625 8C5.03125 3.0625 10.2812 0 16.0312 0ZM8.28125 14.75C7.90625 14.375 7.90625 13.6875 8.28125 13.3125C8.65625 12.9375 9.34375 12.9375 9.71875 13.3125L16.0312 19.625L22.2812 13.3125C22.6562 12.9375 23.3438 12.9375 23.7188 13.3125C24.0938 13.6875 24.0938 14.375 23.7188 14.75L16.7188 21.75C16.3438 22.125 15.6562 22.125 15.2812 21.75L8.28125 14.75Z"/></svg> },
      { type: 'Multiple select', icon: <svg width="13" height="13" viewBox="0 0 28 22" fill="currentColor"><path d="M0 1C0 0.5 0.4375 0 1 0H27C27.5 0 28 0.5 28 1C28 1.5625 27.5 2 27 2H1C0.4375 2 0 1.5625 0 1ZM0 11C0 10.5 0.4375 10 1 10H27C27.5 10 28 10.5 28 11C28 11.5625 27.5 12 27 12H1C0.4375 12 0 11.5625 0 11ZM28 21C28 21.5625 27.5 22 27 22H1C0.4375 22 0 21.5625 0 21C0 20.5 0.4375 20 1 20H27C27.5 20 28 20.5 28 21Z"/></svg> },
      { type: 'Single checkbox', icon: <svg width="13" height="13" viewBox="0 0 28 28" fill="currentColor"><path d="M4 2C2.875 2 2 2.9375 2 4V24C2 25.125 2.875 26 4 26H24C25.0625 26 26 25.125 26 24V4C26 2.9375 25.0625 2 24 2H4ZM0 4C0 1.8125 1.75 0 4 0H24C26.1875 0 28 1.8125 28 4V24C28 26.25 26.1875 28 24 28H4C1.75 28 0 26.25 0 24V4ZM20.6875 10.75L12.6875 18.75C12.3125 19.125 11.625 19.125 11.25 18.75L7.25 14.75C6.875 14.375 6.875 13.6875 7.25 13.3125C7.625 12.9375 8.3125 12.9375 8.6875 13.3125L12 16.625L19.25 9.3125C19.625 8.9375 20.3125 8.9375 20.6875 9.3125C21.0625 9.6875 21.0625 10.375 20.6875 10.75Z"/></svg> },
    ],
  },
  {
    label: 'Text',
    types: [
      { type: 'Single line text', icon: <svg width="13" height="13" viewBox="0 0 24 29" fill="currentColor"><path d="M12.9106 0.625L23.9106 26.625C24.1606 27.125 23.9106 27.75 23.4106 27.9375C22.9106 28.1875 22.2856 27.9375 22.0981 27.4375L19.7856 22H4.22308L1.91058 27.4375C1.72308 27.9375 1.09808 28.1875 0.598076 27.9375C0.0980762 27.75 -0.151924 27.125 0.0980762 26.625L11.0981 0.625C11.2231 0.25 11.5981 0 12.0356 0C12.4106 0 12.7856 0.25 12.9106 0.625ZM18.9731 20L12.0356 3.625L5.03558 20H18.9731Z"/></svg> },
      { type: 'Paragraph text', icon: <svg width="13" height="13" viewBox="0 0 26 28" fill="currentColor"><path d="M0 10C0 4.5 4.4375 0 10 0H14H25C25.5 0 26 0.5 26 1C26 1.5625 25.5 2 25 2H22V27C22 27.5625 21.5 28 21 28C20.4375 28 20 27.5625 20 27V2H16V27C16 27.5625 15.5 28 15 28C14.4375 28 14 27.5625 14 27V20H10C4.4375 20 0 15.5625 0 10ZM14 18V2H10C5.5625 2 2 5.625 2 10C2 14.4375 5.5625 18 10 18H14Z"/></svg> },
    ],
  },
  {
    label: 'Numeric',
    types: [
      { type: 'Number', icon: <svg width="13" height="13" viewBox="0 0 28 28" fill="currentColor"><path d="M12.9375 1.21486L11.625 6.96486H19.5625L21 0.777359C21.125 0.214859 21.6875 -0.0976409 22.1875 0.0273591C22.75 0.152359 23.0625 0.652359 22.9375 1.21486L21.625 6.96486H27C27.5 6.96486 28 7.46486 28 7.96486C28 8.52736 27.5 8.96486 27 8.96486H21.125L18.875 18.9649H25C25.5 18.9649 26 19.4649 26 19.9649C26 20.5274 25.5 20.9649 25 20.9649H18.375L16.9375 27.2149C16.8125 27.7774 16.3125 28.0899 15.75 27.9649C15.1875 27.8399 14.875 27.2774 15 26.7774L16.3125 20.9649H8.375L6.9375 27.2149C6.8125 27.7774 6.3125 28.0899 5.75 27.9649C5.1875 27.8399 4.875 27.2774 5 26.7774L6.3125 20.9649H1C0.4375 20.9649 0 20.5274 0 19.9649C0 19.4649 0.4375 18.9649 1 18.9649H6.8125L9.125 8.96486H3C2.4375 8.96486 2 8.52736 2 7.96486C2 7.46486 2.4375 6.96486 3 6.96486H9.5625L11 0.777359C11.125 0.214859 11.6875 -0.0976409 12.1875 0.0273591C12.75 0.152359 13.0625 0.652359 12.9375 1.21486ZM11.125 8.96486L8.875 18.9649H16.8125L19.125 8.96486H11.125Z"/></svg> },
      { type: 'Slider', icon: <svg width="13" height="13" viewBox="0 0 32 20" fill="currentColor"><path d="M22 2H20C18.875 2 18 2.9375 18 4V16C18 17.125 18.875 18 20 18H22C23.0625 18 24 17.125 24 16V4C24 2.9375 23.0625 2 22 2ZM20 0H22C24.1875 0 26 1.8125 26 4V9H31C31.5 9 32 9.5 32 10C32 10.5625 31.5 11 31 11H26V16C26 18.25 24.1875 20 22 20H20C17.75 20 16 18.25 16 16V4C16 1.8125 17.75 0 20 0ZM0 10C0 9.5 0.4375 9 1 9H14V11H1C0.4375 11 0 10.5625 0 10Z"/></svg> },
      { type: 'Currency', icon: <svg width="13" height="13" viewBox="0 0 36 24" fill="currentColor"><path d="M30 2C30 4.25 31.75 6 34 6V4C34 2.9375 33.0625 2 32 2H30ZM28 2H8C8 5.3125 5.3125 8 2 8V16C5.3125 16 8 18.6875 8 22H28C28 18.6875 30.6875 16 34 16V8C30.6875 8 28 5.3125 28 2ZM2 20C2 21.125 2.875 22 4 22H6C6 19.8125 4.1875 18 2 18V20ZM34 18C31.75 18 30 19.8125 30 22H32C33.0625 22 34 21.125 34 20V18ZM4 2C2.875 2 2 2.9375 2 4V6C4.1875 6 6 4.25 6 2H4ZM0 4C0 1.8125 1.75 0 4 0H32C34.1875 0 36 1.8125 36 4V20C36 22.25 34.1875 24 32 24H4C1.75 24 0 22.25 0 20V4ZM22 12C22 10.625 21.1875 9.3125 20 8.5625C18.75 7.875 17.1875 7.875 16 8.5625C14.75 9.3125 14 10.625 14 12C14 13.4375 14.75 14.75 16 15.5C17.1875 14.75 22 13.4375 22 12ZM12 12C12 9.875 13.125 7.9375 15 6.8125C16.8125 5.75 19.125 5.75 21 6.8125C22.8125 7.9375 24 9.875 24 12C24 14.1875 22.8125 16.125 21 17.25C19.125 18.3125 16.8125 18.3125 15 17.25C13.125 16.125 12 14.1875 12 12Z"/></svg> },
    ],
  },
  {
    label: 'Date',
    types: [
      { type: 'Date', icon: <svg width="13" height="13" viewBox="0 0 28 32" fill="currentColor"><path d="M7 0C7.5 0 8 0.5 8 1V4H20V1C20 0.5 20.4375 0 21 0C21.5 0 22 0.5 22 1V4H24C26.1875 4 28 5.8125 28 8V10V12V28C28 30.25 26.1875 32 24 32H4C1.75 32 0 30.25 0 28V12V10V8C0 5.8125 1.75 4 4 4H6V1C6 0.5 6.4375 0 7 0ZM26 12H2V28C2 29.125 2.875 30 4 30H24C25.0625 30 26 29.125 26 28V12ZM24 6H4C2.875 6 2 6.9375 2 8V10H26V8C26 6.9375 25.0625 6 24 6Z"/></svg> },
    ],
  },
  {
    label: 'User',
    types: [
      { type: 'User', icon: <svg width="13" height="13" viewBox="0 0 32 32" fill="currentColor"><path d="M25.7812 26.0625C28.4062 23.5 30.0312 19.9375 30.0312 16C30.0312 8.3125 23.7188 2 16.0312 2C8.28125 2 2.03125 8.3125 2.03125 16C2.03125 19.9375 3.65625 23.5 6.21875 26.0625C7.09375 22.625 10.2812 20 14.0312 20H18.0312C21.7188 20 24.9062 22.625 25.7812 26.0625ZM23.9688 27.5V27.5625C23.7188 24.4375 21.1562 22 18.0312 22H14.0312C10.8438 22 8.28125 24.4375 8.03125 27.5625C10.2812 29.125 13.0312 30 16.0312 30C18.9688 30 21.7188 29.125 23.9688 27.5ZM16.0312 32C10.2812 32 5.03125 29 2.15625 24C-0.71875 19.0625 -0.71875 13 2.15625 8C5.03125 3.0625 10.2812 0 16.0312 0C21.7188 0 26.9688 3.0625 29.8438 8C32.7188 13 32.7188 19.0625 29.8438 24C26.9688 29 21.7188 32 16.0312 32ZM16.0312 16C17.0938 16 18.0312 15.4375 18.5938 14.5C19.1562 13.625 19.1562 12.4375 18.5938 11.5C18.0312 10.625 17.0938 10 16.0312 10C14.9062 10 13.9688 10.625 13.4062 11.5C12.8438 12.4375 12.8438 13.625 13.4062 14.5C13.9688 15.4375 14.9062 16 16.0312 16ZM11.0312 13C11.0312 11.25 11.9688 9.625 13.5312 8.6875C15.0312 7.8125 16.9688 7.8125 18.5312 8.6875C20.0312 9.625 21.0312 11.25 21.0312 13C21.0312 14.8125 20.0312 16.4375 18.5312 17.375C16.9688 18.25 15.0312 18.25 13.5312 17.375C11.9688 16.4375 11.0312 14.8125 11.0312 13Z"/></svg> },
    ],
  },
]

const FUNCTIONAL_TYPE = 'Single select'

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
    if (type === FUNCTIONAL_TYPE) {
      setTimeout(() => nameRef.current?.focus(), 40)
    }
  }

  function handleNameChange(val: string) {
    setName(val)
    if (val.trim()) { setNameError(false); setFooterError(false) }
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
            {FIELD_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <div className="ft-divider" />}
                <div className="ft-group-label">{group.label}</div>
                {group.types.map(({ type, icon }) => (
                  <div
                    key={type}
                    className={`ft-item${selectedType === type ? ' active' : ''}`}
                    onClick={() => handleSelectType(type)}
                  >
                    {icon}
                    {type}
                  </div>
                ))}
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

            {selectedType && selectedType !== FUNCTIONAL_TYPE && (
              <div className="create-empty">
                <div style={{ fontSize: 40, color: '#e0e0da' }}>⊘</div>
                <h3>{selectedType}</h3>
                <p>This field type is not available in this prototype. Select <strong style={{ color: 'var(--brand)' }}>Single select</strong> to continue.</p>
              </div>
            )}

            {selectedType === FUNCTIONAL_TYPE && (
              <div className="create-config">
                <h3>Single select field</h3>

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

                <div className="options-notice">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                  Options for this field can be added after the field is created. You&apos;ll be taken straight to the field editor when you save.
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
