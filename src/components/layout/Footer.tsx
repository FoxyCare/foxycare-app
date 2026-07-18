import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦊</span>
            <span className="font-bold text-indigo-600">FoxyCare</span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <Link href="/search" className="hover:text-gray-900">
              Find Nannies
            </Link>
            <Link href="/register" className="hover:text-gray-900">
              Join as Nanny
            </Link>
          </nav>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} FoxyCare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
