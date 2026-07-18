import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import type { Booking, Profile } from '@/types'

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export default async function BookingPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500">
          {isNanny
            ? 'Manage your booking requests and schedule.'
            : 'Track and manage your nanny bookings.'}
        </p>
      </div>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No bookings yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(bookings as unknown as Booking[]).map((booking) => {
            const other = isNanny ? booking.parent : booking.nanny
            return (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={(other as Profile)?.avatar_url}
                        name={(other as Profile)?.full_name}
                      />
                      <div>
                        <CardTitle>{(other as Profile)?.full_name}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.start_time).toLocaleDateString()} –{' '}
                          {new Date(booking.end_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[booking.status] ?? 'default'}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>
                      <strong>Rate:</strong> ${booking.hourly_rate}/hr
                    </span>
                    {booking.total_amount && (
                      <span>
                        <strong>Total:</strong> ${booking.total_amount}
                      </span>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="mt-2 text-sm text-gray-600">{booking.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
