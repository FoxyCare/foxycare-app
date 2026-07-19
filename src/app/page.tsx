import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-50 to-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Znajdź idealną{' '}
                <span className="text-indigo-600">nianię</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                FoxyCare łączy rodziny z ogłoszeniami niań w Twojej okolicy.
                Przeglądaj, filtruj i napisz bezpośrednio.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/search">
                  <Button size="lg">Znajdź nianię</Button>
                </Link>
                <Link href="/register?role=nanny">
                  <Button variant="outline" size="lg">
                    Dołącz jako niania
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Jak działa FoxyCare
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  icon: '🔍',
                  title: 'Szukaj i przeglądaj',
                  desc: 'Filtruj ogłoszenia niań po lokalizacji, doświadczeniu, typie pracy i wieku dzieci.',
                },
                {
                  icon: '💬',
                  title: 'Napisz bezpośrednio',
                  desc: 'Wyślij wiadomość, żeby omówić szczegóły i ustalić warunki współpracy.',
                },
                {
                  icon: '📝',
                  title: 'Dodaj ogłoszenie',
                  desc: 'Niania publikuje ofertę z doświadczeniem, lokalizacją i opisem — za darmo.',
                },
              ].map((item) => (
                <Card key={item.title} className="text-center">
                  <CardContent className="flex flex-col items-center gap-4 pt-8">
                    <span className="text-5xl">{item.icon}</span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
