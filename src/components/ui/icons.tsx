import type { SVGProps } from 'react'

export function PersonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="16" cy="9" r="2.8" />
      <path d="M2.5 20c0-3.5 2.7-6 5.5-6s5.5 2.5 5.5 6" />
      <path d="M13.5 14.3c2.4.4 4.5 2.5 4.5 5.7" />
    </svg>
  )
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  )
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.72 18.63.55 12 .55S0 5.72 0 12.07c0 5.74 4.39 10.5 10.13 11.36v-8.04H7.08v-3.32h3.05V9.41c0-2.98 1.83-4.62 4.6-4.62 1.33 0 2.72.23 2.72.23v2.9h-1.53c-1.51 0-1.98.92-1.98 1.86v2.23h3.37l-.54 3.32h-2.83v8.04C19.61 22.57 24 17.81 24 12.07Z"
      />
    </svg>
  )
}

export function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.36 1.43c0 1.14-.46 2.24-1.2 3.05-.82.89-2.15 1.58-3.24 1.49-.14-1.1.43-2.27 1.18-3.06.83-.9 2.26-1.6 3.26-1.48ZM19.9 17.53c-.5 1.13-.74 1.64-1.38 2.64-.9 1.4-2.16 3.13-3.73 3.15-1.39.02-1.75-.9-3.63-.89-1.88.01-2.28.9-3.67.89-1.57-.02-2.76-1.6-3.66-3-2.5-3.87-2.77-8.42-1.22-10.84 1.1-1.72 2.83-2.73 4.46-2.73 1.66 0 2.7.91 4.08.91 1.33 0 2.14-.91 4.06-.91 1.45 0 2.99.79 4.08 2.15-3.59 1.97-3.01 7.09.61 8.63Z" />
    </svg>
  )
}
