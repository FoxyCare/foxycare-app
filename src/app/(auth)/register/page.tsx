import { Suspense } from 'react'
import RegisterForm from './RegisterForm'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />}>
      <RegisterForm />
    </Suspense>
  )
}
