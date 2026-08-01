'use client'

import { useEffect, useId, useRef } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onExpire?: () => void
}

// Cloudflare's widget, not a package — one script tag + one <div>, no need
// to pull in a wrapper library for this. Supabase Auth verifies the token
// server-side against Cloudflare (security_captcha_* in the Auth config),
// so this component's only job is to produce that token and hand it to
// whichever supabase-js call passes it as options.captchaToken.
export function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const elementId = useId()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetIdRef.current) return

    function render() {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: onVerify,
        'expired-callback': onExpire,
      })
    }

    if (window.turnstile) {
      render()
    } else {
      // The script tag below may still be loading — poll briefly rather
      // than relying only on its onLoad (StrictMode/fast navigation can
      // mount this before that fires).
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          render()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [siteKey, onVerify, onExpire])

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [])

  if (!siteKey) {
    // Missing config shouldn't brick the form in local dev — just skip
    // rendering the widget (Supabase-side captcha enforcement, once turned
    // on, is what actually matters; this is only reached if someone forgot
    // to set the env var on an environment where it's expected).
    return null
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div id={elementId} ref={containerRef} />
    </>
  )
}
