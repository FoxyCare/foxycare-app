import Link from 'next/link'
import { BrandLogo, BrandWordmark } from '@/components/brand/BrandLogo'

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo className="h-8 w-8" />
            <BrandWordmark className="font-semibold" />
          </Link>
          <nav className="flex gap-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-brand-600">
              Strona główna
            </Link>
            <Link href="/search" className="hover:text-brand-600">
              Znajdź nianię
            </Link>
            <Link href="/register?role=nanny" className="hover:text-brand-600">
              Zostań nianią
            </Link>
          </nav>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FoxyCare. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  )
}
