import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MessageNannyButton } from '@/components/MessageNannyButton'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { JOB_TYPE_LABEL, AGE_RANGE_LABEL } from '@/lib/labels'
import type { Ad, NannyProfile, User } from '@/types'

export default async function NannyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: nannyProfile } = await supabase
    .from('nanny_profiles')
    .select('*')
    .eq('user_id', id)
    .single<NannyProfile>()

  if (!nannyProfile) notFound()

  // Only visible to authenticated viewers per RLS — anonymous visitors fall
  // back to an ad title below, same as the homepage/search cards.
  const { data: nannyUser } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', id)
    .maybeSingle<Pick<User, 'id' | 'full_name'>>()

  const { data: ads } = await supabase
    .from('ads')
    .select('*, images:ad_images(*)')
    .eq('nanny_id', id)
    .order('created_at', { ascending: false })
    .returns<Ad[]>()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const viewerProfile = authUser
    ? (await supabase.from('users').select('*').eq('id', authUser.id).single()).data
    : null

  const displayName = nannyUser?.full_name ?? ads?.[0]?.title ?? 'Niania'

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={viewerProfile as User | null} />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar src={nannyProfile.avatar_url} name={displayName} size="xl" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {nannyProfile.location && (
                    <p className="text-gray-500">📍 {nannyProfile.location}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge>{nannyProfile.experience_years} lat doświadczenia</Badge>
                    {nannyProfile.job_type && <Badge>{JOB_TYPE_LABEL[nannyProfile.job_type]}</Badge>}
                    {nannyProfile.children_age_range && (
                      <Badge>{AGE_RANGE_LABEL[nannyProfile.children_age_range]}</Badge>
                    )}
                  </div>
                </div>
                <MessageNannyButton nannyId={id} />
              </div>
              {nannyProfile.description && (
                <p className="mt-6 whitespace-pre-line text-gray-700">{nannyProfile.description}</p>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Ogłoszenia ({ads?.length ?? 0})
            </h2>
            {!ads || ads.length === 0 ? (
              <p className="text-gray-500">Ta niania nie ma jeszcze żadnych ogłoszeń.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {ads.map((ad) => (
                  <Card key={ad.id}>
                    <CardContent className="pt-6">
                      <p className="font-semibold text-gray-900">{ad.title}</p>
                      {ad.location && <p className="text-sm text-gray-500">📍 {ad.location}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ad.price != null && (
                          <Badge variant="info">{formatCurrency(ad.price)}/godz.</Badge>
                        )}
                        <Badge>{ad.experience_years} lat doświadczenia</Badge>
                        {ad.job_type && <Badge>{JOB_TYPE_LABEL[ad.job_type]}</Badge>}
                        {ad.children_age_range && (
                          <Badge>{AGE_RANGE_LABEL[ad.children_age_range]}</Badge>
                        )}
                      </div>
                      {ad.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{ad.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
