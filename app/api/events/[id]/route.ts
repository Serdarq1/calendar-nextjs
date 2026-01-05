import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

const mapEvent = async (row: any) => {
  const iso = row.date ? new Date(row.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  const day = Number(iso.split('-')[2]) || new Date(iso).getDate()
  
  let members = []

  if (row.type === 'collaborative') {
    // Fetch ALL calendar members
    const { data: memberData } = await supabaseServer
      .from('calendar_members')
      .select('user_id, profiles(id, full_name, avatar_url)')
      .eq('calendar_id', row.calendar_id)
      .eq('accepted', true)

    members = memberData?.map(m => ({
      id: m.profiles?.id,
      name: m.profiles?.full_name || 'Member',
      avatar: m.profiles?.avatar_url || undefined
    })) || []

    // Add owner if not in members
    const { data: owner } = await supabaseServer
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', row.owner_id)
      .single()

    if (owner && !members.some(m => m.id === owner.id)) {
      members.unshift({
        id: owner.id,
        name: owner.full_name || 'Owner',
        avatar: owner.avatar_url || undefined
      })
    }
  } else {
    // For single events, just show the owner
    const { data: owner } = await supabaseServer
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', row.owner_id)
      .single()

    if (owner) {
      members = [{
        id: owner.id,
        name: owner.full_name || 'Owner',
        avatar: owner.avatar_url || undefined
      }]
    }
  }

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
    members
  }
}

const userCalendarIds = async (userId: string) => {
  const ids = new Set<string>()
  const { data: owned } = await supabaseServer
    .from('calendars')
    .select('id')
    .eq('owner_id', userId)
  owned?.forEach((c) => ids.add(c.id))

  const { data: member } = await supabaseServer
    .from('calendar_members')
    .select('calendar_id')
    .eq('user_id', userId)
    .eq('accepted', true)
  member?.forEach((c) => ids.add(c.calendar_id))

  return Array.from(ids)
}

// GET single event
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = params

  const { data: event, error } = await supabaseServer
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const allowed = await userCalendarIds(userId)
  if (!allowed.includes(event.calendar_id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const mapped = await mapEvent(event)
  return NextResponse.json({ event: mapped })
}

// PATCH update event
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) {
    console.log('❌ Unauthorized')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = params
  
  let body
  try {
    body = await req.json()
  } catch (err) {
    console.error('❌ Invalid JSON')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('📝 Updating event:', { id, userId, body })

  // Load the event to get calendar_id
  const { data: existing, error: fetchError } = await supabaseServer
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    console.error('❌ Event not found')
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const allowed = await userCalendarIds(userId)
  if (!allowed.includes(existing.calendar_id)) {
    console.error('❌ Forbidden: user does not have access to this calendar')
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const updates: any = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.status !== undefined) {
    updates.status = body.status
    updates.type = body.status === 'Birlikte' ? 'collaborative' : 'single'
  }
  if (body.date !== undefined) updates.date = new Date(body.date).toISOString().slice(0, 10)
  if (body.time !== undefined) updates.time = body.time || null
  if (body.type !== undefined) updates.type = body.type

  console.log('💾 Applying updates:', updates)

  const { data, error } = await supabaseServer
    .from('events')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('❌ Failed to update:', error)
    return NextResponse.json({ error: 'failed to update' }, { status: 500 })
  }

  console.log('✅ Event updated successfully')
  const mapped = await mapEvent(data)
  return NextResponse.json({ event: mapped })
}

// DELETE event
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = params

  const { data: existing } = await supabaseServer
    .from('events')
    .select('calendar_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ ok: true })
  }

  const allowed = await userCalendarIds(userId)
  if (!allowed.includes(existing.calendar_id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  await supabaseServer.from('events').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
