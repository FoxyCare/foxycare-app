import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/Card'

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const onlineSince = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const [totalUsers, onlineUsers, parents, nannies, banned, publishedProfiles] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_seen_at', onlineSince),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'nanny'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_banned', true),
    supabase.from('nanny_profiles').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const stats = [
    { label: 'Użytkownicy ogółem', value: totalUsers.count ?? 0 },
    { label: 'Użytkownicy online (5 min)', value: onlineUsers.count ?? 0 },
    { label: 'Rodzice', value: parents.count ?? 0 },
    { label: 'Nianie', value: nannies.count ?? 0 },
    { label: 'Opublikowane profile', value: publishedProfiles.count ?? 0 },
    { label: 'Zbanowani', value: banned.count ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Administratora</h1>
        <p className="text-gray-500">Przegląd statystyk platformy</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
