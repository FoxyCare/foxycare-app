import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-3xl">🦊</span>
        <span className="text-2xl font-bold text-indigo-600">FoxyCare</span>
      </Link>
      {children}
    </div>
  )
}
