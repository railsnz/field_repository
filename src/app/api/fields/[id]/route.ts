import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const field = store.getField(id)
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(field)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const field = store.updateField(id, body)
  if (!field) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(field)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = store.deleteField(id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
