import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import { Section, P, Ul } from '@/components/legal/LegalDoc'
import { PRIVACY_VERSION, PRIVACY_EFFECTIVE_DATE } from '@/lib/legal/privacy'

export const metadata: Metadata = {
  title: 'Polityka Prywatności – FoxyCare',
  description: 'Polityka Prywatności serwisu FoxyCare.',
}

// SZKIC WYMAGAJĄCY WERYFIKACJI PRAWNEJ PRZED PUBLIKACJĄ.
// Uzupełnić dane Administratora w §1 (te same [DO UZUPEŁNIENIA] co w
// /terms §1.2). §3.3 celowo nie podaje konkretnego regionu hostingu
// Supabase/Vercel (region jest szczegółem operacyjnym, który się zmienia
// niezależnie od tego dokumentu) — zamiast tego opisuje zabezpieczenia
// stosowane niezależnie od aktualnego regionu, patrz rozmowa z 2026-07-20.
export default function PrivacyPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Polityka Prywatności FoxyCare</h1>
        <p className="mt-2 text-sm text-gray-500">
          Wersja {PRIVACY_VERSION}, obowiązuje od {PRIVACY_EFFECTIVE_DATE}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700 sm:text-base">
          <Section title="§1. Administrator danych">
            <P>
              1.1. Administratorem danych osobowych przetwarzanych w związku z korzystaniem z
              serwisu FoxyCare (dalej: „Serwis”) jest{' '}
              <span className="font-medium">
                [DO UZUPEŁNIENIA: pełna nazwa podmiotu / imię i nazwisko przedsiębiorcy, adres
                siedziby, NIP, REGON (jeśli dotyczy)]
              </span>{' '}
              (dalej: „Administrator”), ten sam podmiot co Operator wskazany w{' '}
              <Link href="/terms" className="text-brand-600 underline">
                Regulaminie
              </Link>
              .
            </P>
            <P>
              1.2. W sprawach dotyczących ochrony danych osobowych można kontaktować się pod
              adresem e-mail: <span className="font-medium">[DO UZUPEŁNIENIA]</span>.
            </P>
            <P>
              1.3. Administrator nie powołał Inspektora Ochrony Danych, gdyż nie zachodzą
              przesłanki obowiązkowego wyznaczenia takiej osoby określone w art. 37 RODO.
            </P>
          </Section>

          <Section title="§2. Jakie dane przetwarzamy, w jakim celu i na jakiej podstawie">
            <P>
              2.1. Dane podane przy rejestracji (imię i nazwisko, adres e-mail, hasło — hasło jest
              przechowywane wyłącznie w postaci zahaszowanej i nigdy nie jest dostępne
              Administratorowi w postaci jawnej): w celu utworzenia i obsługi Konta oraz
              świadczenia usług Serwisu — podstawa: art. 6 ust. 1 lit. b RODO (niezbędność do
              wykonania umowy, tj. Regulaminu).
            </P>
            <P>
              2.2. Dane profilu i treść Ogłoszeń (lokalizacja, opis, zdjęcie, doświadczenie, zakres
              wieku dzieci, rodzaj zatrudnienia) podane dobrowolnie przez Użytkownika: w celu
              publikacji i wyszukiwania Ogłoszeń — podstawa: art. 6 ust. 1 lit. b oraz lit. f RODO
              (prawnie uzasadniony interes Administratora polegający na umożliwieniu działania
              tablicy ogłoszeń).
            </P>
            <P>
              2.3. Treść wiadomości wymienianych między Użytkownikami na czacie Serwisu: w celu
              umożliwienia kontaktu między Rodzicem a Nianią — podstawa: art. 6 ust. 1 lit. b RODO.
              Administrator nie odczytuje ani nie moderuje treści wiadomości w toku zwykłego
              działania Serwisu.
            </P>
            <P>
              2.4. Dane techniczne (adres IP, logi serwera, informacje o urządzeniu i
              przeglądarce), zbierane automatycznie przez dostawców infrastruktury Serwisu: w celu
              zapewnienia bezpieczeństwa, wykrywania nadużyć i prawidłowego działania Serwisu —
              podstawa: art. 6 ust. 1 lit. f RODO.
            </P>
            <P>
              2.5. Dane podane w korespondencji reklamacyjnej lub kontaktowej: w celu rozpatrzenia
              zgłoszenia — podstawa: art. 6 ust. 1 lit. f RODO, a w zakresie, w jakim dotyczy praw
              konsumenta — art. 6 ust. 1 lit. c RODO.
            </P>
            <P>
              2.6. Dane niezbędne do ustalenia, dochodzenia lub obrony przed roszczeniami — podstawa:
              art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes Administratora).
            </P>
          </Section>

          <Section title="§3. Odbiorcy danych i przekazywanie danych poza EOG">
            <P>
              3.1. Dane są przetwarzane przy użyciu infrastruktury dostawców, którzy działają jako
              podmioty przetwarzające na podstawie zawartych z nimi umów powierzenia przetwarzania
              danych:
            </P>
            <Ul
              items={[
                <>
                  <b>Supabase</b> (baza danych, uwierzytelnianie Użytkowników),
                </>,
                <>
                  <b>Vercel</b> (hosting aplikacji).
                </>,
              ]}
            />
            <P>
              3.2. Poza wskazanymi dostawcami infrastruktury Administrator nie udostępnia danych
              osobowych innym podmiotom, chyba że obowiązek taki wynika z przepisów prawa (np. na
              żądanie uprawnionego organu).
            </P>
            <P>
              3.3. Dostawcy wskazani w §3.1 są podmiotami powiązanymi z grupami działającymi poza
              Europejskim Obszarem Gospodarczym, w związku z czym przetwarzanie danych może wiązać
              się z ich przekazaniem poza EOG (niezależnie od regionu, w którym fizycznie
              skonfigurowano przechowywanie danych w danym momencie — Administrator może tę
              konfigurację zmieniać). W każdym takim przypadku przekazanie odbywa się z
              zastosowaniem odpowiednich zabezpieczeń przewidzianych w RODO, w szczególności
              standardowych klauzul umownych zatwierdzonych przez Komisję Europejską, na podstawie
              umów zawartych przez Administratora z tymi dostawcami. Kopię stosowanych zabezpieczeń
              można uzyskać, kontaktując się z Administratorem na adres wskazany w §1.2.
            </P>
          </Section>

          <Section title="§4. Dane dotyczące dzieci">
            <P>
              4.1. Konto w Serwisie może założyć wyłącznie osoba pełnoletnia — Serwis nie jest
              kierowany do osób poniżej 18. roku życia i nie przetwarza ich danych jako
              Użytkowników.
            </P>
            <P>
              4.2. Serwis nie zbiera danych identyfikujących konkretne dziecko pozostające pod
              opieką (np. imienia, wizerunku, adresu) — jedynie ogólny, kategoryzowany przedział
              wiekowy dzieci, których dotyczy Ogłoszenie. Administrator zwraca się do Użytkowników
              o niezamieszczanie w treści Ogłoszeń ani wiadomości danych osobowych dzieci.
            </P>
          </Section>

          <Section title="§5. Okres przechowywania danych">
            <P>
              5.1. Dane Konta i treść Ogłoszeń są przechowywane przez okres posiadania Konta w
              Serwisie i usuwane niezwłocznie po jego usunięciu, z zastrzeżeniem §5.3.
            </P>
            <P>5.2. Wiadomości są przechowywane tak długo, jak długo istnieje Konto ich nadawcy lub odbiorcy.</P>
            <P>
              5.3. Dane niezbędne do ustalenia, dochodzenia lub obrony przed roszczeniami mogą być
              przechowywane przez okres przedawnienia tych roszczeń zgodnie z Kodeksem cywilnym (co
              do zasady 6 lat, a dla roszczeń okresowych i związanych z prowadzeniem działalności
              gospodarczej — 3 lata, art. 118 Kodeksu cywilnego).
            </P>
          </Section>

          <Section title="§6. Prawa osoby, której dane dotyczą">
            <P>W związku z przetwarzaniem danych osobowych przysługują Państwu następujące prawa:</P>
            <Ul
              items={[
                'prawo dostępu do danych (art. 15 RODO),',
                'prawo do sprostowania danych (art. 16 RODO),',
                'prawo do usunięcia danych, tzw. „prawo do bycia zapomnianym" (art. 17 RODO),',
                'prawo do ograniczenia przetwarzania (art. 18 RODO),',
                'prawo do przenoszenia danych (art. 20 RODO),',
                'prawo do wniesienia sprzeciwu wobec przetwarzania opartego na art. 6 ust. 1 lit. f RODO (art. 21 RODO),',
                'prawo do cofnięcia zgody w dowolnym momencie, jeżeli przetwarzanie odbywa się na jej podstawie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.',
              ]}
            />
            <P>
              6.2. Przysługuje Państwu również prawo wniesienia skargi do organu nadzorczego —
              Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).
            </P>
            <P>
              6.3. W celu realizacji powyższych praw prosimy o kontakt na adres wskazany w §1.2.
            </P>
          </Section>

          <Section title="§7. Dobrowolność podania danych">
            <P>
              7.1. Podanie danych osobowych jest dobrowolne, jednak niezbędne do założenia Konta i
              korzystania z Serwisu — ich niepodanie uniemożliwia rejestrację i świadczenie usług
              opisanych w Regulaminie.
            </P>
          </Section>

          <Section title="§8. Zautomatyzowane podejmowanie decyzji">
            <P>
              8.1. Administrator nie podejmuje wobec Użytkowników decyzji opierających się
              wyłącznie na zautomatyzowanym przetwarzaniu danych, w tym profilowaniu, wywołujących
              skutki prawne lub w podobny sposób istotnie na nich wpływających, w rozumieniu art.
              22 RODO.
            </P>
          </Section>

          <Section title="§9. Bezpieczeństwo danych">
            <Ul
              items={[
                'hasła Użytkowników są przechowywane wyłącznie w postaci zahaszowanej,',
                'transmisja danych między Użytkownikiem a Serwisem jest szyfrowana (HTTPS/TLS),',
                'dostęp do danych w bazie jest ograniczony mechanizmem Row Level Security, przypisującym każdemu Użytkownikowi dostęp wyłącznie do danych, do których jest uprawniony,',
                'Administrator może zablokować Konto naruszające Regulamin — zasady opisuje Regulamin, §9.',
              ]}
            />
          </Section>

          <Section title="§10. Pliki cookies">
            <P>
              10.1. Serwis wykorzystuje wyłącznie pliki cookies niezbędne do jego prawidłowego
              działania — w szczególności cookies utrzymujące sesję zalogowanego Użytkownika,
              ustawiane przez mechanizm uwierzytelniania Supabase. Bez tych plików logowanie i
              korzystanie z Konta nie byłoby możliwe.
            </P>
            <P>
              10.2. Serwis nie wykorzystuje obecnie plików cookies analitycznych, statystycznych
              ani marketingowych. W związku z tym, zgodnie z art. 173 ust. 3 pkt 2 ustawy Prawo
              telekomunikacyjne, korzystanie z cookies niezbędnych nie wymaga odrębnej zgody
              Użytkownika. Jeżeli w przyszłości Serwis zacznie wykorzystywać inne rodzaje cookies,
              niniejsza Polityka zostanie zaktualizowana, a tam gdzie wymagane — wdrożony zostanie
              mechanizm uzyskiwania zgody.
            </P>
          </Section>

          <Section title="§11. Zmiany Polityki Prywatności">
            <P>
              11.1. Administrator może zmieniać niniejszą Politykę Prywatności, w szczególności w
              razie zmiany przepisów prawa lub sposobu przetwarzania danych. Aktualna wersja jest
              zawsze dostępna pod adresem{' '}
              <Link href="/privacy" className="text-brand-600 underline">
                foxycare.app/privacy
              </Link>
              .
            </P>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  )
}
