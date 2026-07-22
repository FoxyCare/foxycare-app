import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { BrandLogo, BrandWordmark } from "@/components/brand/BrandLogo";
import { PersonIcon, SearchIcon, PeopleIcon } from "@/components/ui/icons";
import { NannyCard } from "@/components/NannyCard";
import { createClient } from "@/lib/supabase/server";
import type { NannyPublicProfile, User } from "@/types";

const STEPS = [
  {
    Icon: PersonIcon,
    title: "Zarejestruj się",
    desc: "Załóż konto i stwórz swój profil.",
    href: "/register",
  },
  {
    Icon: SearchIcon,
    title: "Znajdź nianię",
    desc: "Przeglądaj profile niań w Twojej okolicy.",
    href: "/search",
  },
  {
    Icon: PeopleIcon,
    title: "Umów spotkanie",
    desc: "Skontaktuj się i porównaj nianie osobiście.",
    href: "/search",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const profile = authUser
    ? (await supabase.from("users").select("*").eq("id", authUser.id).single())
        .data
    : null;

  const { data: nannies } = await supabase
    .from("nanny_public_profiles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(3)
    .returns<NannyPublicProfile[]>();

  return (
    <>
      <Navbar profile={profile as User | null} />
      <main>
        {/* Hero */}
        <section className="bg-cream">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
            <div>
              <BrandLogo className="h-32 w-32" priority />
              <BrandWordmark className="mt-4 block text-4xl font-extrabold tracking-tight sm:text-5xl" />
              <p className="mt-6 text-xl font-normal text-gray-600 sm:text-2xl">
                Znajdź idealną nianię w swojej okolicy
              </p>
              <Link href="/search" className="mt-8 inline-block">
                <Button size="lg" className="rounded-full px-8">
                  Znajdź nianię
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <img
                src="/hero-illustration-2.webp"
                alt="Opiekunka czytająca dziecku książkę"
                className="w-full max-w-sm scale-105 sm:max-w-md lg:max-w-none [-webkit-mask-composite:source-in] [-webkit-mask-image:linear-gradient(to_right,transparent,black_33%,black_67%,transparent),linear-gradient(to_bottom,transparent,black_33%,black_67%,transparent)] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_33%,black_67%,transparent),linear-gradient(to_bottom,transparent,black_33%,black_67%,transparent)]"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900">Jak to działa</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {STEPS.map(({ Icon, title, desc, href }) => (
                <Link
                  key={title}
                  href={href}
                  className="block rounded-2xl bg-cream p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured ads */}
        <section className="bg-cream py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              Znajdź idealną nianię
            </h2>
            {!nannies || nannies.length === 0 ? (
              <p className="mt-8 text-center text-gray-500">
                Jeszcze nikt nie dodał ogłoszenia —{" "}
                <Link
                  href="/register?role=nanny"
                  className="text-brand-600 hover:underline"
                >
                  bądź pierwszą nianią
                </Link>
                .
              </p>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {nannies.map((nanny) => (
                  <NannyCard key={nanny.id} nanny={nanny} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
