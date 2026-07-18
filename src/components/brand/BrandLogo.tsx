import Image from 'next/image'

interface BrandLogoProps {
  className?: string
  priority?: boolean
}

const LOGO_SRC =
  'https://github.com/user-attachments/assets/edb40a91-2e95-4022-838f-b8bb16c4278a'

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="FoxyCare logo"
      width={256}
      height={256}
      className={className}
      priority={priority}
    />
  )
}
