import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
