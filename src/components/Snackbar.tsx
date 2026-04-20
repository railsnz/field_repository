'use client'

import { useEffect, useRef } from 'react'
import { SnackbarState } from '@/types'

interface SnackbarProps {
  snackbar: SnackbarState | null
  onUndo: () => void
  onDismiss: () => void
}

export default function Snackbar({ snackbar, onUndo, onDismiss }: SnackbarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (snackbar) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onDismiss, 4000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [snackbar])

  return (
    <div className={`snackbar${snackbar ? ' show' : ''}`}>
      <span>{snackbar?.message ?? ''}</span>
      {snackbar?.undoFn && (
        <button className="snackbar-undo" onClick={onUndo}>Undo</button>
      )}
    </div>
  )
}
