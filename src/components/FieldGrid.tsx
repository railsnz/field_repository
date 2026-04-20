'use client'

import { Field } from '@/types'

interface FieldGridProps {
  fields: Field[]
  activeFieldId: string | null
  onRowClick: (field: Field) => void
}

export default function FieldGrid({ fields, activeFieldId, onRowClick }: FieldGridProps) {
  return (
    <div className="grid-wrap">
      <div className="grid-head">
        <span>Field name ↑</span>
        <span>Field type</span>
        <span>Hint</span>
        <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Usage</span>
      </div>
      <div className="grid-body">
        {fields.map(field => (
          <div
            key={field.id}
            className={`row${field.id === activeFieldId ? ' active-row' : ''}`}
            onClick={() => onRowClick(field)}
          >
            <span className="field-name">{field.name}</span>
            <span className="field-type">
              <span className="type-icon">≡</span> {field.type}
            </span>
            <span className="hint-cell">{field.hint}</span>
            <div className="usage-cell">
              <button className="eye-btn" onClick={e => e.stopPropagation()} title="Usage">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="8" cy="8" r="2" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
