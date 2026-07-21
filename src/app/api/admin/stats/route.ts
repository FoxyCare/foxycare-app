import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET() {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  const onlineSince = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const [totalUsers, onlineUsers, parents, nannies, admins, banned, publishedProfiles] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_seen_at', onlineSince),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'nanny'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_banned', true),
    supabase.from('nanny_profiles').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ])

  return NextResponse.json({
    totalUsers: totalUsers.count ?? 0,
    onlineUsers: onlineUsers.count ?? 0,
    parentsCount: parents.count ?? 0,
    nanniesCount: nannies.count ?? 0,
    adminsCount: admins.count ?? 0,
    bannedCount: banned.count ?? 0,
    publishedProfilesCount: publishedProfiles.count ?? 0,
  })
}
