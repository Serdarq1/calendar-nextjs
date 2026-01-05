import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    // ✅ Call clerkClient() as a function
    const clerk = await clerkClient()
    const user = await clerk.users.getUser(userId)

    const email = user.primaryEmailAddress?.emailAddress || 
                  user.emailAddresses[0]?.emailAddress || null
    const full_name = user.fullName || user.username || email || null
    const avatar_url = user.imageUrl || null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, email, full_name, avatar_url },
        { onConflict: 'id' }
      )

    if (error) {
      console.error('❌ Supabase profile error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Profile synced for:', userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('❌ Profile sync error:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 })
  }
}