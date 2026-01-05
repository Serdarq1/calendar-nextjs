import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

const mapEvent = (row: any) => {
  const iso = row.date ? new Date(row.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  const day = Number(iso.split('-')[2]) || new Date(iso).getDate()
  return {
    id: row.id,
    calendar_id: row.calendar_id,
    owner_id: row.owner_id,
    title: row.title,
    status: row.status,
    date: iso,
    day,
    time: row.time || undefined,
    type: row.type || 'single',
    members: row.members || [],
  }
}

const userCalendarIds = async (userId: string) => {
  const ids = new Set<string>()
  const { data: owned } = await supabaseServer.from('calendars').select('id').eq('owner_id', userId)
  owned?.forEach((c) => ids.add(c.id))
  const { data: member } = await supabaseServer.from('calendar_members').select('calendar_id').eq('user_id', userId).eq('accepted', true)
  member?.forEach((c) => ids.add(c.calendar_id))
  return Array.from(ids)
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params
  const body = await req.json()

  const { data: existing, error: fetchError } = await supabaseServer.from('events').select('*').eq('id', id).single()
  if (fetchError || !existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const allowed = await userCalendarIds(userId)
  if (!allowed.includes(existing.calendar_id)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const updates: any = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.status !== undefined) updates.status = body.status
  if (body.date !== undefined) updates.date = new Date(body.date).toISOString().slice(0, 10)
  if (body.time !== undefined) updates.time = body.time
  if (body.type !== undefined) updates.type = body.type
  if (body.members !== undefined) updates.members = body.members

  const { data, error } = await supabaseServer
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: 'failed to update' }, { status: 500 })

  return NextResponse.json({ event: mapEvent(data) })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { id } = await context.params

  const { data: existing } = await supabaseServer.from('events').select('calendar_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ ok: true })

  const allowed = await userCalendarIds(userId)
  if (!allowed.includes(existing.calendar_id)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  await supabaseServer.from('events').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
