// app/api/events/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

// app/api/events/route.ts - Update the mapEvent function
const mapEvent = async (row: any) => {
  const iso = row.date ? new Date(row.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  const day = Number(iso.split('-')[2]) || new Date(iso).getDate()
  const members: { id?: string; name: string; avatar?: string }[] = []

  if (row.type === 'collaborative') {
    console.log('🔍 Fetching members for collaborative event:', row.id, 'calendar:', row.calendar_id)
    
    // Fetch ALL calendar members (not just event members)
    const { data: memberData, error } = await supabaseServer
      .from('calendar_members')
      .select('user_id, profiles(id, full_name, avatar_url)')
      .eq('calendar_id', row.calendar_id)
      .eq('accepted', true)

    if (error) {
      console.error('❌ Error fetching members:', error)
    } else {
      console.log('✅ Found members:', memberData?.length)
      members = memberData?.map(m => ({
        id: m.profiles?.id,
        name: m.profiles?.full_name || 'Member',
        avatar: m.profiles?.avatar_url || undefined
      })) || []
    }

    // Also add the owner if not already in members
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

  console.log('📊 Event members:', { eventId: row.id, type: row.type, memberCount: members.length })

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

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const calendarId = searchParams.get('calendarId')

  const allowedCalendars = await userCalendarIds(userId)
  if (allowedCalendars.length === 0) return NextResponse.json({ events: [] })
  if (calendarId && !allowedCalendars.includes(calendarId)) return NextResponse.json({ events: [] })

  const targetIds = calendarId ? [calendarId] : allowedCalendars

  const { data, error } = await supabaseServer
    .from('events')
    .select('*')
    .in('calendar_id', targetIds)
    .order('date', { ascending: true })

  if (error) {
    console.error('GET events error', error)
    return NextResponse.json({ error: 'Failed to load events', events: [] }, { status: 500 })
  }

  const mappedEvents = await Promise.all((data || []).map(mapEvent))
  return NextResponse.json({ events: mappedEvents })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, status, date, time, type, calendar_id } = body
  if (!title || !date || !status || !calendar_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const allowedCalendars = await userCalendarIds(userId)
  if (!allowedCalendars.includes(calendar_id)) {
    return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  }

  const iso = new Date(date).toISOString().slice(0, 10)
  const eventId = body.id || crypto.randomUUID()
  const eventType = type || (status === 'Birlikte' ? 'collaborative' : 'single')

  const { data, error } = await supabaseServer
    .from('events')
    .insert({
      id: eventId,
      calendar_id,
      owner_id: userId,
      title,
      status,
      date: iso,
      time,
      type: eventType,
    })
    .select('*')
    .single()

  if (error) {
    console.error('POST event error', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  const mapped = await mapEvent(data)
  return NextResponse.json({ event: mapped })
}
