import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; optId: string }> }) {
  const { id, optId } = await params
  const { label } = await request.json()
  if (!label) return NextResponse.json({ error: 'label required' }, { status: 400 })
  const opt = store.updateOption(id, optId, label)
  if (!opt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(opt)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; optId: string }> }) {
  const { id, optId } = await params
  const opts = store.deleteOption(id, optId)
  return NextResponse.json(opts)
}
