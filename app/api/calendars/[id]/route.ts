import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function PATCH(request: Request, context: any) {
  console.log('🔵 PATCH /api/calendars/[id] hit')
  
  const { userId } = await auth()
  if (!userId) {
    console.log('❌ No userId')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Handle params properly for Next.js 15
  const params = await context.params
  const calendarId = params.id
  
  console.log('📋 Calendar ID:', calendarId)
  console.log('👤 User ID:', userId)

  let body
  try {
    body = await request.json()
  } catch (err) {
    console.error('❌ JSON parse error:', err)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name } = body
  console.log('📝 New name:', name)

  if (!name || !name.trim()) {
    console.log('❌ Name is empty')
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  // Check if calendar exists
  const { data: calendar, error: calError } = await supabaseServer
    .from('calendars')
    .select('owner_id')
    .eq('id', calendarId)
    .maybeSingle()

  if (calError) {
    console.error('❌ Error fetching calendar:', calError)
    return NextResponse.json({ error: 'database error' }, { status: 500 })
  }

  if (!calendar) {
    console.log('❌ Calendar not found')
    return NextResponse.json({ error: 'calendar not found' }, { status: 404 })
  }

  console.log('📅 Calendar owner:', calendar.owner_id)

  // Check permissions
  if (calendar.owner_id !== userId) {
    const { data: member } = await supabaseServer
      .from('calendar_members')
      .select('role')
      .eq('calendar_id', calendarId)
      .eq('user_id', userId)
      .maybeSingle()

    console.log('👥 Member role:', member?.role)

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      console.log('❌ Forbidden')
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  // Update the calendar
  const { error: updateError } = await supabaseServer
    .from('calendars')
    .update({ name: name.trim() })
    .eq('id', calendarId)

  if (updateError) {
    console.error('❌ Update error:', updateError)
    return NextResponse.json({ error: 'failed to update' }, { status: 500 })
  }

  console.log('✅ Calendar renamed successfully')
  return NextResponse.json({ ok: true, name: name.trim() })
}