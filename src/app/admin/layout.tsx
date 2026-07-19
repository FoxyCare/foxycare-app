import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { User } from '@/types'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single<User>()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={profile} />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="mb-6 flex gap-4 border-b border-gray-200 pb-3 text-sm font-medium">
            <Link href="/admin" className="text-gray-700 hover:text-brand-600">
              Przegląd
            </Link>
            <Link href="/admin/nannies" className="text-gray-700 hover:text-brand-600">
              Nianie
            </Link>
            <Link href="/admin/parents" className="text-gray-700 hover:text-brand-600">
              Rodzice
            </Link>
          </nav>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
