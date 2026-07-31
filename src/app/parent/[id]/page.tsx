import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MessageUserButton } from '@/components/MessageUserButton'
import { PhoneReveal } from '@/components/PhoneReveal'
import { ReportUserButton } from '@/components/ReportUserButton'
import { NannyPhoto } from '@/components/NannyPhoto'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import type { ParentProfile, User } from '@/types'

// Mirrors /nanny/[id], simplified: parent_profiles (foxycare-db migration
// 0032) is never anon-readable, and /parent/[id] isn't in proxy.ts's
// PUBLIC_ROUTES, so an unauthenticated visitor is redirected to /login
// before this page ever runs — unlike the nanny page, there's no anon
// fallback branch needed to read full_name.
export default async function ParentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // RLS (migration 0032) only returns this row when it's published, or the
  // caller is the owner or an admin — a legitimately-hidden profile comes
  // back as zero rows, not an error, so this must be maybeSingle(), not
  // single() (which would throw on 0 rows).
  const { data: parentProfile } = await supabase
    .from('parent_profiles')
    .select('*')
    .eq('user_id', id)
    .maybeSingle<ParentProfile>()

  if (!parentProfile) notFound()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const { data: parentUser } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', id)
    .maybeSingle<Pick<User, 'full_name'>>()
  const displayName = parentUser?.full_name ?? 'Rodzic'

  const viewerProfile = authUser
    ? (await supabase.from('users').select('*').eq('id', authUser.id).single()).data
    : null

  const isOwnProfile = authUser?.id === id

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={viewerProfile as User | null} />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          {isOwnProfile && !parentProfile.is_published && (
            <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
              Twój profil jest niewidoczny dla niań.{' '}
              <Link href="/profile" className="font-medium underline">
                Opublikuj go w Mój profil
              </Link>
              .
            </div>
          )}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <NannyPhoto
                  src={parentProfile.avatar_url}
                  name={displayName}
                  className="h-40 w-40 shrink-0 rounded-2xl sm:h-48 sm:w-48"
                  initialsClassName="text-5xl"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {parentProfile.title && <p className="text-gray-700">{parentProfile.title}</p>}
                  {parentProfile.location && (
                    <p className="text-gray-500">📍 {parentProfile.location}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {parentProfile.job_type?.map((jt) => <Badge key={jt}>{JOB_TYPE_LABEL[jt]}</Badge>)}
                    {parentProfile.children_age_range?.map((range) => (
                      <Badge key={range}>{AGE_RANGE_LABEL[range]}</Badge>
                    ))}
                  </div>
                </div>
                {!isOwnProfile && (
                  <div className="flex flex-col items-stretch gap-2">
                    <MessageUserButton userId={id} />
                    <PhoneReveal userId={id} />
                    <ReportUserButton reportedUserId={id} size="sm" />
                  </div>
                )}
              </div>
              {parentProfile.description && (
                <p className="mt-6 whitespace-pre-line text-gray-700">{parentProfile.description}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
