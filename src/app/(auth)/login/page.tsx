import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />}>
      <LoginForm />
    </Suspense>
  )
}
