interface BrandLogoProps {
  className?: string
  priority?: boolean
}

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="FoxyCare logo"
      className={className}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}

interface BrandWordmarkProps {
  className?: string
}

export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span className={className}>
      <span className="text-brand-600">Foxy</span>
      <span className="text-gray-600">Care</span>
    </span>
  )
}
