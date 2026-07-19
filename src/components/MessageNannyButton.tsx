'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Button, type ButtonProps } from '@/components/ui/Button'

export function MessageNannyButton({
  nannyId,
  className,
  size,
}: {
  nannyId: string
  className?: string
  size?: ButtonProps['size']
}) {
  const router = useRouter()
  const { user } = useUser()
  const [isSending, setIsSending] = useState(false)

  const messageNanny = useCallback(async () => {
    if (!user) {
      router.push(`/login?redirectTo=/nanny/${nannyId}`)
      return
    }
    setIsSending(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ other_user_id: nannyId }),
    })
    const conversation = await res.json()
    setIsSending(false)
    if (res.ok) router.push(`/chat?conversation=${conversation.id}`)
  }, [user, nannyId, router])

  return (
    <Button className={className} size={size} isLoading={isSending} onClick={messageNanny}>
      Napisz wiadomość
    </Button>
  )
}
