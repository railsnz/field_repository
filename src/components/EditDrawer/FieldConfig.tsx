'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Field, Option } from '@/types'
import DefaultDropdown from './DefaultDropdown'

interface FieldConfigProps {
  field: Field
  options: Option[]
  context?: 'field' | 'matter'
  showCreateAlias?: boolean
  onUpdateField: (updates: Partial<Field>) => Promise<void>
  onSnackbar: (msg: string, undoFn?: () => Promise<void>) => void
}

type FieldKey = 'desc' | 'placeholder' | 'defaultOption'

const editIcon = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const pillCross = (
  <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)
const infoIcon = (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 7.5v4M8 5.2v.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

export default function FieldConfig({
  field, options, context = 'field', showCreateAlias = false,
  onUpdateField, onSnackbar,
}: FieldConfigProps) {
  const [open, setOpen] = useState(true)
  const [name, setName] = useState(field.name)
  const [desc, setDesc] = useState(field.description)
  const [placeholder, setPlaceholder] = useState(field.placeholder)
  const [defaultVal, setDefaultVal] = useState(field.defaultOption)
  const [defaultDropVisible, setDefaultDropVisible] = useState(false)
  const [activeFields, setActiveFields] = useState<Set<FieldKey>>(new Set())
  const [customizedFields, setCustomizedFields] = useState<Set<FieldKey>>(new Set())
  // Create form alias
  const [createAlias, setCreateAlias] = useState(field.name)
  const [aliasActive, setAliasActive] = useState(false)
  const [aliasCustomized, setAliasCustomized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; align: 'center' | 'right' } | null>(null)
  const defaultInputRef = useRef<HTMLInputElement>(null)
  const aliasInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Sync local state when a different field is opened
  useEffect(() => {
    setName(field.name)
    setDesc(field.description)
    setPlaceholder(field.placeholder)
    setDefaultVal(field.defaultOption)
    setActiveFields(new Set())
    setCustomizedFields(new Set())
    setCreateAlias(field.name)
    setAliasActive(false)
    setAliasCustomized(false)
  }, [field.id])

  function showTip(text: string, e: React.MouseEvent, align: 'center' | 'right' = 'center') {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    if (align === 'right') {
      setTooltip({ text, x: cx + 7, y: rect.top, align: 'right' })
    } else {
      setTooltip({ text, x: Math.min(cx, window.innerWidth - 100), y: rect.top, align: 'center' })
    }
  }

  function activateField(key: FieldKey) {
    setActiveFields(prev => new Set([...prev, key]))
  }

  function deactivateField(key: FieldKey, changed: boolean) {
    setActiveFields(prev => { const n = new Set(prev); n.delete(key); return n })
    if (changed) setCustomizedFields(prev => new Set([...prev, key]))
  }

  function resetField(key: FieldKey) {
    setCustomizedFields(prev => { const n = new Set(prev); n.delete(key); return n })
    setActiveFields(prev => { const n = new Set(prev); n.delete(key); return n })
  }

  async function handleNameBlur() {
    if (name === field.name) return
    const prev = field.name
    await onUpdateField({ name })
    onSnackbar('Field name saved', async () => { setName(prev); await onUpdateField({ name: prev }) })
  }

  async function handleDescBlur() {
    const changed = desc !== field.description
    if (changed) {
      const prev = field.description
      await onUpdateField({ description: desc })
      onSnackbar('Description saved', async () => { setDesc(prev); await onUpdateField({ description: prev }) })
    }
    if (context === 'matter') deactivateField('desc', changed)
  }

  async function handlePlaceholderBlur() {
    const changed = placeholder !== field.placeholder
    if (changed) {
      const prev = field.placeholder
      await onUpdateField({ placeholder })
      onSnackbar('Placeholder saved', async () => { setPlaceholder(prev); await onUpdateField({ placeholder: prev }) })
    }
    if (context === 'matter') deactivateField('placeholder', changed)
  }

  async function handleSelectDefault(val: string) {
    const prev = field.defaultOption
    const changed = val !== prev
    setDefaultVal(val)
    setDefaultDropVisible(false)
    await onUpdateField({ defaultOption: val })
    if (val) onSnackbar(`Default set to "${val}"`, async () => { setDefaultVal(prev); await onUpdateField({ defaultOption: prev }) })
    else onSnackbar('Default option cleared', async () => { setDefaultVal(prev); await onUpdateField({ defaultOption: prev }) })
    if (context === 'matter') deactivateField('defaultOption', changed)
  }

  // Alias save
  function handleAliasSave() {
    const trimmed = createAlias.trim()
    const isChanged = trimmed !== field.name && trimmed.length > 0
    if (!trimmed) setCreateAlias(field.name)
    setAliasActive(false)
    if (isChanged) {
      setAliasCustomized(true)
      onSnackbar('Create form alias saved', async () => {
        setCreateAlias(field.name)
        setAliasCustomized(false)
      })
    }
  }

  // ── Sub-components ───────────────────────────────────

  function OverrideControl({ fieldKey }: { fieldKey: FieldKey }) {
    const isCustomized = customizedFields.has(fieldKey)
    if (isCustomized) {
      return (
        <button className="override-pill" type="button" onClick={() => activateField(fieldKey)}>
          Customized
          <span
            className="override-pill-cross"
            title="Reset to global"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); resetField(fieldKey) }}
          >
            {pillCross}
          </span>
        </button>
      )
    }
    return (
      <button
        className="field-edit-btn"
        type="button"
        onMouseEnter={e => showTip('Edit for this type only', e, 'right')}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => activateField(fieldKey)}
      >
        {editIcon}
      </button>
    )
  }

  function AliasOverrideControl() {
    if (aliasCustomized) {
      return (
        <button
          className="override-pill"
          type="button"
          onClick={() => { setAliasActive(true); setTimeout(() => aliasInputRef.current?.focus(), 0) }}
        >
          Customized
          <span
            className="override-pill-cross"
            title="Reset to field name"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
              setCreateAlias(field.name)
              setAliasCustomized(false)
              setAliasActive(false)
            }}
          >
            {pillCross}
          </span>
        </button>
      )
    }
    return (
      <button
        className="field-edit-btn"
        type="button"
        onMouseEnter={e => showTip('Edit for this type only', e, 'right')}
        onMouseLeave={() => setTooltip(null)}
        onClick={() => { setAliasActive(true); setTimeout(() => aliasInputRef.current?.focus(), 0) }}
      >
        {editIcon}
      </button>
    )
  }

  return (
    <>
    <div className="accordion">
      <div className="accordion-header">
        <span className="accordion-title">Field configuration</span>
        <button className="accordion-toggle-btn" onClick={() => setOpen(o => !o)} type="button" aria-label="Toggle field configuration">
          <span className={`accordion-chevron${open ? ' open' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
      </div>

      <div className="accordion-body" style={{ maxHeight: open ? '600px' : '0', overflow: 'hidden' }}>
        <div className="field-settings">

          {/* Field name */}
          <div className="form-row">
            <span className="form-label">Field name</span>
            {context === 'matter' ? (
              <div className="form-input form-input-readonly">{name}</div>
            ) : (
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={e => { if (e.key === 'Tab' || e.key === 'Enter') e.currentTarget.blur() }}
              />
            )}
          </div>

          {/* Create form alias — shown only on create form sub-tab */}
          {showCreateAlias && (
            <div className="form-row">
              <span className="form-label-with-info">
                <span className="form-label" style={{ width: 'auto' }}>Create form label</span>
                <button
                  className="info-icon-btn"
                  type="button"
                  onMouseEnter={e => showTip(
                    'Replaces the field name on the create form only — ideal for shorter or more user-friendly labels without renaming the underlying field.',
                    e,
                    'center',
                  )}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {infoIcon}
                </button>
              </span>
              {aliasActive ? (
                <input
                  ref={aliasInputRef}
                  className="form-input"
                  value={createAlias}
                  onChange={e => setCreateAlias(e.target.value)}
                  onBlur={handleAliasSave}
                  onKeyDown={e => { if (e.key === 'Enter') aliasInputRef.current?.blur(); if (e.key === 'Escape') { setCreateAlias(aliasCustomized ? createAlias : field.name); setAliasActive(false) } }}
                  autoFocus
                />
              ) : (
                <div className="form-input form-input-readonly">{createAlias || field.name}</div>
              )}
              <AliasOverrideControl />
            </div>
          )}

          {/* Description */}
          <div className="form-row">
            <span className="form-label">Description</span>
            {context === 'matter' && !activeFields.has('desc') ? (
              <div className="form-input form-input-readonly">
                {desc || <span className="readonly-placeholder">Add a description…</span>}
              </div>
            ) : (
              <input
                className="form-input"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                onBlur={handleDescBlur}
                onKeyDown={e => { if (e.key === 'Tab' || e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="Add a description…"
                autoFocus={context === 'matter' && activeFields.has('desc')}
              />
            )}
            {context === 'matter' && <OverrideControl fieldKey="desc" />}
          </div>

          {/* Placeholder text */}
          <div className="form-row">
            <span className="form-label">Placeholder text</span>
            {context === 'matter' && !activeFields.has('placeholder') ? (
              <div className="form-input form-input-readonly">
                {placeholder || <span className="readonly-placeholder">e.g. Select a jurisdiction…</span>}
              </div>
            ) : (
              <input
                className="form-input"
                value={placeholder}
                onChange={e => setPlaceholder(e.target.value)}
                onBlur={handlePlaceholderBlur}
                onKeyDown={e => { if (e.key === 'Tab' || e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="e.g. Select a jurisdiction…"
                autoFocus={context === 'matter' && activeFields.has('placeholder')}
              />
            )}
            {context === 'matter' && <OverrideControl fieldKey="placeholder" />}
          </div>

          {/* Default option */}
          <div className="form-row" style={{ position: 'relative', overflow: 'visible' }}>
            <span className="form-label">Default option</span>
            {context === 'matter' && !activeFields.has('defaultOption') ? (
              <div className="form-input form-input-readonly">
                {defaultVal || <span className="readonly-placeholder">Search to set default…</span>}
              </div>
            ) : (
              <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                <input
                  ref={defaultInputRef}
                  className="form-input"
                  style={{ width: '100%' }}
                  value={defaultVal}
                  onChange={e => setDefaultVal(e.target.value)}
                  onFocus={() => setDefaultDropVisible(true)}
                  onBlur={() => setTimeout(() => {
                    setDefaultDropVisible(false)
                    if (context === 'matter') deactivateField('defaultOption', defaultVal !== field.defaultOption)
                  }, 150)}
                  placeholder="Search to set default…"
                  autoComplete="off"
                  autoFocus={context === 'matter' && activeFields.has('defaultOption')}
                />
                <DefaultDropdown
                  inputRef={defaultInputRef}
                  options={options}
                  value={defaultVal}
                  onChange={setDefaultVal}
                  onSelect={handleSelectDefault}
                  visible={defaultDropVisible}
                  onHide={() => setDefaultDropVisible(false)}
                />
              </div>
            )}
            {context === 'matter' && <OverrideControl fieldKey="defaultOption" />}
          </div>

        </div>
      </div>
    </div>

    {/* Portal tooltip */}
    {mounted && tooltip && createPortal(
      <div style={{
        position: 'fixed',
        top: tooltip.y - 8,
        left: tooltip.x,
        transform: tooltip.align === 'right'
          ? 'translateX(-100%) translateY(-100%)'
          : 'translateX(-50%) translateY(-100%)',
        background: '#1a1a1a',
        color: '#fff',
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: 4,
        whiteSpace: 'normal',
        pointerEvents: 'none',
        zIndex: 9999,
        maxWidth: 240,
        lineHeight: 1.5,
      }}>
        {tooltip.text}
        <div style={{
          position: 'absolute',
          top: '100%',
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
