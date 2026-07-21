import Link from 'next/link'
import { NannyPhoto } from '@/components/NannyPhoto'
import type { NannyPublicProfile } from '@/types'

export function NannyCard({ nanny }: { nanny: NannyPublicProfile }) {
  const headline = nanny.title ?? nanny.full_name

  return (
    <Link
      href={`/nanny/${nanny.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <NannyPhoto
        src={nanny.avatar_url}
        name={nanny.full_name}
        className="aspect-[4/3]"
        initialsClassName="text-4xl"
      />
      <div className="p-5">
        <p className="font-semibold text-gray-900">
          {headline}
          {nanny.location && <span className="font-normal text-gray-500">, {nanny.location}</span>}
        </p>
        {nanny.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{nanny.description}</p>
        )}
        <span className="mt-4 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors group-hover:bg-brand-700">
          Zajrzyj na profil
        </span>
      </div>
    </Link>
  )
}
