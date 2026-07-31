import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PublishToggleButton } from '@/components/PublishToggleButton'
import type { NannyProfile, ParentProfile, User } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userRow } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single<User>()

  if (userRow?.role === 'admin') redirect('/admin')

  const isNanny = userRow?.role === 'nanny'

  const { data: roleProfile } = await supabase
    .from(isNanny ? 'nanny_profiles' : 'parent_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<NannyProfile | ParentProfile>()

  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={roleProfile?.avatar_url} name={userRow?.full_name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Witaj, {userRow?.full_name?.split(' ')[0] ?? 'tam'}!
            </h1>
            <p className="text-gray-500 capitalize">
              {isNanny ? 'Konto niani' : 'Konto rodzica'}
            </p>
          </div>
        </div>
        <Link href="/profile">
          <Button variant="outline">Edytuj profil</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-gray-500">Status profilu</p>
              <p className="mt-1">
                <Badge variant={roleProfile?.is_published ? 'success' : 'default'}>
                  {roleProfile?.is_published ? 'Opublikowany' : 'Nieopublikowany'}
                </Badge>
              </p>
            </div>
            <PublishToggleButton profile={roleProfile ?? {}} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Rozmowy</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{conversationCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Twój profil</CardTitle>
          </CardHeader>
          <CardContent>
            {roleProfile?.title ? (
              <p className="text-sm font-medium text-gray-900">{roleProfile.title}</p>
            ) : (
              <p className="text-sm text-gray-500">Nie uzupełniono jeszcze tytułu ogłoszenia.</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {isNanny
                ? roleProfile?.is_published
                  ? 'Twój profil jest widoczny dla rodziców w wyszukiwarce.'
                  : 'Twój profil nie jest jeszcze widoczny dla rodziców.'
                : roleProfile?.is_published
                  ? 'Twój profil jest widoczny dla niań w wyszukiwarce.'
                  : 'Twój profil nie jest jeszcze widoczny dla niań.'}
            </p>
            <Link href="/profile" className="mt-4 inline-block">
              <Button size="sm">Zarządzaj profilem</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isNanny ? 'Znajdź rodzinę' : 'Znajdź nianię'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Przeglądaj i filtruj ogłoszenia {isNanny ? 'rodzin' : 'niań'} w{' '}
              <Link href="/search" className="text-brand-600 hover:underline">
                wyszukiwarce
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
