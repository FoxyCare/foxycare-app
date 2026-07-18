import type { ReactNode } from 'react'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand/BrandLogo'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <BrandLogo className="h-14 w-auto" priority />
      </Link>
      {children}
    </div>
  )
}
