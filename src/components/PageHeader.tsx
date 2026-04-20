'use client'

interface PageHeaderProps {
  onAddField: () => void
}

export default function PageHeader({ onAddField }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>Field library</h1>
        <p>Set up a library of fields to make sure you capture all the data you need. Once your fields have been created you can add them to various matter types.</p>
      </div>
      <button className="btn-primary" onClick={onAddField}>+ Add field</button>
    </div>
  )
}
