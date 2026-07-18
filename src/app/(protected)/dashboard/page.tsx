import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import type { Booking, Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const isNanny = profile?.role === 'nanny'

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, parent:profiles!parent_id(*), nanny:profiles!nanny_id(*)')
    .eq(isNanny ? 'nanny_id' : 'parent_id', profile?.id ?? '')
    .order('created_at', { ascending: false })
    .limit(5)

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'warning',
    confirmed: 'info',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar
          src={(profile as Profile)?.avatar_url}
          name={(profile as Profile)?.full_name}
          size="lg"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {(profile as Profile)?.full_name?.split(' ')[0] ?? 'there'}!
          </h1>
          <p className="text-gray-500 capitalize">{profile?.role} account</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Bookings', value: bookings?.length ?? 0 },
          {
            label: 'Upcoming',
            value:
              bookings?.filter((b) => b.status === 'confirmed').length ?? 0,
          },
          {
            label: 'Completed',
            value:
              bookings?.filter((b) => b.status === 'completed').length ?? 0,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {(bookings as unknown as Booking[]).map((booking) => {
                const other = isNanny ? booking.parent : booking.nanny
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={(other as Profile)?.full_name}
                        src={(other as Profile)?.avatar_url}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(other as Profile)?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.start_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[booking.status] ?? 'default'}>
                      {booking.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
