import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json(store.getOptions(id))
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { label } = await request.json()
  if (!label) return NextResponse.json({ error: 'label required' }, { status: 400 })
  const opts = store.addOption(id, label)
  return NextResponse.json(opts, { status: 201 })
}

// Bulk replace (reorder or sort A-Z)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { options } = await request.json()
  if (!Array.isArray(options)) return NextResponse.json({ error: 'options array required' }, { status: 400 })
  const opts = store.bulkUpdateOptions(id, options)
  return NextResponse.json(opts)
}
