export interface Field {
  id: string
  name: string
  type: string
  hint: string
  description: string
  placeholder: string
  defaultOption: string
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
