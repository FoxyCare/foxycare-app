'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getInitials } from '@/lib/utils'
import type { Ad } from '@/types'

export function AdCard({ ad }: { ad: Ad }) {
  const [imageFailed, setImageFailed] = useState(false)
  const photo = ad.images?.[0]?.image_url
  const displayName = ad.nanny?.full_name ?? ad.title
  const showPhoto = Boolean(photo) && !imageFailed

  return (
    <Link
      href="/search"
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-200 to-brand-400">
        {showPhoto ? (
          <img
            src={photo}
            alt={displayName}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/90">
            {getInitials(displayName)}
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="font-semibold text-gray-900">
          {displayName}
          {ad.location && <span className="font-normal text-gray-500">, {ad.location}</span>}
        </p>
        {ad.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ad.description}</p>
        )}
        <span className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors group-hover:bg-brand-700">
          Zajrzyj na profil
        </span>
      </div>
    </Link>
  )
}
