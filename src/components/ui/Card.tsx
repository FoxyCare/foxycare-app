import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardProps = HTMLAttributes<HTMLDivElement>

function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('p-6 pb-0', className)} {...props}>
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardContent({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'flex items-center border-t border-gray-100 p-6 pt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter }
