import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabaseServer'

const mapCalendar = (row: any) => ({
  id: row.id,
  name: row.name,
  role: row.role || 'owner',
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ calendars: [] })

  const calendars: any[] = []

  const { data: owned } = await supabaseServer
    .from('calendars')
    .select('id,name')
    .eq('owner_id', userId)
  owned?.forEach((c) => calendars.push({ ...c, role: 'owner' }))

  const { data: member } = await supabaseServer
    .from('calendar_members')
    .select('role, calendars(id,name)')
    .eq('user_id', userId)
    .eq('accepted', true)
  member?.forEach((m) => {
    if (m.calendars) calendars.push({ ...m.calendars, role: m.role || 'editor' })
  })

  return NextResponse.json({ calendars })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name } = body
  const id = body.id || crypto.randomUUID()

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { data, error } = await supabaseServer
    .from('calendars')
    .insert({ id, name, owner_id: userId })
    .select('id,name')
    .single()

  if (error) return NextResponse.json({ error: 'failed to create' }, { status: 500 })

  // ensure membership row for owner
  await supabaseServer
    .from('calendar_members')
    .upsert({ calendar_id: data.id, user_id: userId, role: 'owner', accepted: true })

  return NextResponse.json({ calendar: mapCalendar({ ...data, role: 'owner' }) })
}
