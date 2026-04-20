'use client'

import { Option } from '@/types'

interface MergeModalProps {
  sourceOption: Option | null
  allOptions: Option[]
  onConfirm: (targetId: string, targetLabel: string) => Promise<void>
  onClose: () => void
}

export default function MergeModal({ sourceOption, allOptions, onConfirm, onClose }: MergeModalProps) {
  const isOpen = !!sourceOption
  const others = allOptions.filter(o => o.id !== sourceOption?.id)

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const select = form.elements.namedItem('merge-target') as HTMLSelectElement
    if (!select.value) { alert('Please select a target option.'); return }
    const target = others.find(o => o.id === select.value)
    if (!target) return
    await onConfirm(target.id, target.label)
  }

  return (
    <div className={`modal-backdrop${isOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal merge-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Merge option</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleConfirm}>
          <p className="modal-desc">
            Merge <strong>&ldquo;{sourceOption?.label}&rdquo;</strong> into another option. All records currently using this option will be updated to use the target option.
          </p>
          <div className="merge-target-label">Merge into</div>
          <select className="merge-select" name="merge-target" defaultValue="">
            <option value="">Select target option…</option>
            {others.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <div className="merge-warning">
            ⚠️ This action cannot be undone after the 8-second window. All existing records will be updated immediately.
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-danger">Merge option</button>
          </div>
        </form>
      </div>
    </div>
  )
}
