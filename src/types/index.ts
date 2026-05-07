export interface Field {
  id: string
  name: string
  type: string
  hint: string
  description: string
  placeholder: string
  defaultOption: string
  sortMode: 'az' | 'custom'
  createdAt: number
}

export interface Option {
  id: string
  label: string
  order: number
  pinned?: boolean
}

export interface SnackbarState {
  message: string
  undoFn?: () => Promise<void>
}
