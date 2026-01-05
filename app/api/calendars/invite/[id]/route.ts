import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

// PATCH - Rename calendar
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

  const { name } = body

  if (!name || !name.trim()) {
    console.log('❌ Missing name')
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  console.log('📝 Renaming calendar:', { id, newName: name, userId })

  // Check if user is owner or editor
  const { data: calendar } = await supabaseServer
    .from('calendars')
    .select('owner_id')
    .eq('id', id)
    .maybeSingle()

  if (!calendar) {
    console.log('❌ Calendar not found')
    return NextResponse.json({ error: 'calendar not found' }, { status: 404 })
  }

  if (calendar.owner_id !== userId) {
    const { data: member } = await supabaseServer
      .from('calendar_members')
      .select('role')
      .eq('calendar_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      console.log('❌ Forbidden: user is not owner/editor')
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  const { error } = await supabaseServer
    .from('calendars')
    .update({ name: name.trim() })
    .eq('id', id)

  if (error) {
    console.error('❌ Failed to rename calendar:', error)
    return NextResponse.json({ error: 'failed to update' }, { status: 500 })
  }

  console.log('✅ Calendar renamed successfully')
  return NextResponse.json({ ok: true, name: name.trim() })
}

// GET - Get single calendar details (optional but useful)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = params

  const { data: calendar, error } = await supabaseServer
    .from('calendars')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !calendar) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  // Check access
  const isOwner = calendar.owner_id === userId
  const { data: member } = await supabaseServer
    .from('calendar_members')
    .select('role')
    .eq('calendar_id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!isOwner && !member) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  return NextResponse.json({ 
    calendar: { 
      ...calendar, 
      role: isOwner ? 'owner' : member?.role 
    } 
  })
}

// DELETE - Delete calendar (optional)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = params

  const { data: calendar } = await supabaseServer
    .from('calendars')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!calendar || calendar.owner_id !== userId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { error } = await supabaseServer
    .from('calendars')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}