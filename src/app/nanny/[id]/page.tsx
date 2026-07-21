import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MessageNannyButton } from '@/components/MessageNannyButton'
import { NannyPhoto } from '@/components/NannyPhoto'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import type { NannyProfile, NannyPublicProfile, User } from '@/types'

export default async function NannyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // RLS (migration 0020) only returns this row when it's published, or the
  // caller is the owner or an admin — a legitimately-hidden profile comes
  // back as zero rows, not an error, so this must be maybeSingle(), not
  // single() (which would throw on 0 rows).
  const { data: nannyProfile } = await supabase
    .from('nanny_profiles')
    .select('*')
    .eq('user_id', id)
    .maybeSingle<NannyProfile>()

  if (!nannyProfile) notFound()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // full_name lives on users, not nanny_profiles. users is authenticated-
  // only for SELECT (any logged-in viewer may read any row, per RLS), so
  // this works for every case except a fully anonymous visitor — who falls
  // back to nanny_public_profiles, guaranteed to have a row here since
  // nannyProfile above only resolved for anon via its is_published=true
  // branch of the RLS check.
  let fullName: string | null = null
  if (authUser) {
    const { data: nannyUser } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', id)
      .maybeSingle<Pick<User, 'full_name'>>()
    fullName = nannyUser?.full_name ?? null
  }
  if (!fullName) {
    const { data: publicProfile } = await supabase
      .from('nanny_public_profiles')
      .select('full_name')
      .eq('id', id)
      .maybeSingle<Pick<NannyPublicProfile, 'full_name'>>()
    fullName = publicProfile?.full_name ?? null
  }
  const displayName = fullName ?? 'Niania'

  const viewerProfile = authUser
    ? (await supabase.from('users').select('*').eq('id', authUser.id).single()).data
    : null

  const isOwnProfile = authUser?.id === id

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={viewerProfile as User | null} />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          {isOwnProfile && !nannyProfile.is_published && (
            <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
              Twój profil jest niewidoczny dla rodziców.{' '}
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
                  src={nannyProfile.avatar_url}
                  name={displayName}
                  className="h-40 w-40 shrink-0 rounded-2xl sm:h-48 sm:w-48"
                  initialsClassName="text-5xl"
                />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {nannyProfile.title && <p className="text-gray-700">{nannyProfile.title}</p>}
                  {nannyProfile.location && (
                    <p className="text-gray-500">📍 {nannyProfile.location}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {nannyProfile.price != null && (
                      <Badge variant="info">{formatCurrency(nannyProfile.price)}/godz.</Badge>
                    )}
                    <Badge>{nannyProfile.experience_years} lat doświadczenia</Badge>
                    {nannyProfile.job_type?.map((jt) => <Badge key={jt}>{JOB_TYPE_LABEL[jt]}</Badge>)}
                    {nannyProfile.children_age_range?.map((range) => (
                      <Badge key={range}>{AGE_RANGE_LABEL[range]}</Badge>
                    ))}
                  </div>
                </div>
                {!isOwnProfile && <MessageNannyButton nannyId={id} />}
              </div>
              {nannyProfile.description && (
                <p className="mt-6 whitespace-pre-line text-gray-700">{nannyProfile.description}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
