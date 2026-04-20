import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET() {
  return NextResponse.json(store.getFields())
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, type, hint, description, placeholder } = body
  if (!name || !type) {
    return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
  }
  const field = store.createField({ name, type, hint, description, placeholder })
  return NextResponse.json(field, { status: 201 })
}
