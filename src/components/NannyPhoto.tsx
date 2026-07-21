'use client'

import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'

// Shared fallback behavior (broken/missing avatar_url -> initials on a
// brand-gradient tile) between NannyCard's cover photo and the bigger hero
// photo on the public nanny profile page. A plain circular <Avatar> is too
// small and crops too much of a face at profile-hero sizes, so this
// renders a squarish tile instead — size/shape controlled via className.
export function NannyPhoto({
  src,
  name,
  className,
  initialsClassName,
}: {
  src?: string | null
  name: string
  className?: string
  initialsClassName?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showPhoto = Boolean(src) && !imageFailed

  return (
    <div
      className={cn(
        'overflow-hidden bg-gradient-to-br from-brand-200 to-brand-400',
        className
      )}
    >
      {showPhoto ? (
        <img
          src={src!}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center font-bold text-white/90',
            initialsClassName
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}
