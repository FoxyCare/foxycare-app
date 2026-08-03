import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

export async function GET(request: Request) {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  if (role !== 'parent' && role !== 'nanny') {
    return NextResponse.json({ error: 'role must be "parent" or "nanny"' }, { status: 400 })
  }

  const name = searchParams.get('name')?.trim()
  const location = searchParams.get('location')?.trim()
  const jobType = searchParams.getAll('job_type')
  const ageRange = searchParams.getAll('children_age_range')
  const minExperience = role === 'nanny' ? searchParams.get('min_experience') : null

  // A user can exist with this role and no profile row at all if they
  // registered but never finished onboarding (nanny_profiles/parent_profiles
  // is only created on the first PUT /api/profile, at the end of that
  // flow) — an admin moderation view needs to see those accounts too, so
  // the join must be LEFT by default, not !inner.
  //
  // But PostgREST's dot-notation filters on a *left*-joined embed (e.g.
  // profile.location=ilike.*x*) don't exclude non-matching rows — they
  // just null out the embedded object for rows that don't match, so every
  // user would still come back, just with profile:null whenever it
  // doesn't match. That's exactly backwards for a filter. So: use !inner
  // only when a profile-column filter is actually applied (a user with no
  // profile can never match one of those anyway), and plain left join for
  // the default, unfiltered "show me everyone with this role" view.
  const hasProfileFilter = !!(location || jobType.length || ageRange.length || minExperience)
  const profileTable = role === 'nanny' ? 'nanny_profiles' : 'parent_profiles'
  const profileEmbed = hasProfileFilter ? `${profileTable}!inner` : profileTable

  let query = supabase
    .from('users')
    .select(`*, profile:${profileEmbed}(*)`)
    .eq('role', role)
    .order('created_at', { ascending: false })

  if (name) query = query.ilike('full_name', `%${name}%`)
  if (location) query = query.ilike('profile.location', `%${location}%`)

  // job_type/children_age_range apply to both roles now — parent_profiles
  // got the same columns in foxycare-db migration 0032.
  if (jobType.length) query = query.overlaps('profile.job_type', jobType)
  if (ageRange.length) query = query.overlaps('profile.children_age_range', ageRange)
  if (minExperience) query = query.gte('profile.experience_years', Number(minExperience))

  const { data, error } = await query.limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
