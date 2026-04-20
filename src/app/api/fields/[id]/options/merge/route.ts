import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sourceId, targetId } = await request.json()
  if (!sourceId || !targetId) return NextResponse.json({ error: 'sourceId and targetId required' }, { status: 400 })
  const opts = store.mergeOptions(id, sourceId, targetId)
  return NextResponse.json(opts)
}
