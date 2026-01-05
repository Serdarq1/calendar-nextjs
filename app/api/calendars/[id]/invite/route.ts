import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id: calendarId } = await context.params
  const body = await req.json()
  const email = (body.email as string | undefined)?.toLowerCase().trim()
  const role = (body.role as string | undefined) || 'editor'

  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Only allow owners or editors to invite
  const { data: calendar } = await supabaseServer
    .from('calendars')
    .select('owner_id')
    .eq('id', calendarId)
    .single()

  const { data: membership } = await supabaseServer
    .from('calendar_members')
    .select('role')
    .eq('calendar_id', calendarId)
    .eq('user_id', userId)
    .maybeSingle()

  const isOwner = calendar?.owner_id === userId
  const isEditor = membership?.role === 'editor' || membership?.role === 'owner'

  if (!isOwner && !isEditor) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Find the invited user profile by email
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!profile?.id) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  // Add or update membership and mark accepted immediately so they see the calendar
  const { error } = await supabaseServer
    .from('calendar_members')
    .upsert({
      calendar_id: calendarId,
      user_id: profile.id,
      role,
      accepted: true,
    })

  if (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'failed to invite' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
