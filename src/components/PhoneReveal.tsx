'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Button, type ButtonProps } from '@/components/ui/Button'

// "Pokaż numer telefonu" — hidden by default, requires login, reveals via
// POST /api/phone-reveal/[id] (foxycare-db's reveal_phone() RPC, which also
// records the reveal for the owner's own stat). shareable is checked up
// front via GET on the same route so the button doesn't render at all when
// there's nothing to reveal.
export function PhoneReveal({
  userId,
  className,
  size,
}: {
  userId: string
  className?: string
  size?: ButtonProps['size']
}) {
  const router = useRouter()
  const { user } = useUser()
  const [shareable, setShareable] = useState(false)
  const [phone, setPhone] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/phone-reveal/${userId}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) setShareable(!!body.shareable)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const reveal = useCallback(async () => {
    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/phone-reveal/${userId}`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'Nie udało się pobrać numeru telefonu')
        return
      }
      setPhone(body.phone)
    } finally {
      setIsLoading(false)
    }
  }, [user, userId, router])

  if (!shareable) return null

  if (phone) {
    return (
      <a
        href={`tel:${phone}`}
        className={`inline-flex items-center gap-2 font-medium text-brand-700 ${className ?? ''}`}
      >
        📞 {phone}
      </a>
    )
  }

  return (
    <div className={className}>
      <Button type="button" variant="outline" size={size} isLoading={isLoading} onClick={reveal}>
        📞 Pokaż numer telefonu
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
