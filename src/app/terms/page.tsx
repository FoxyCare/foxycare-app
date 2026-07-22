import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/Footer'
import { Section, P, Ul } from '@/components/legal/LegalDoc'
import { TERMS_VERSION, TERMS_EFFECTIVE_DATE } from '@/lib/legal/terms'

export const metadata: Metadata = {
  title: 'Regulamin – FoxyCare',
  description: 'Regulamin serwisu FoxyCare.',
}

// SZKIC WYMAGAJĄCY WERYFIKACJI PRAWNEJ PRZED PUBLIKACJĄ.
// Uzupełnić dane Operatora (nazwa, adres, NIP/REGON, e-mail do reklamacji)
// w sekcji §1.2 poniżej, oraz cennik/dostawcę płatności w §6 — oznaczone
// jako [DO UZUPEŁNIENIA]. Płatności za publikację Ogłoszenia nie są jeszcze
// zaimplementowane w aplikacji (brak integracji z operatorem płatności) —
// ten paragraf opisuje docelowy model, patrz rozmowa z 2026-07-20.
export default function TermsPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Regulamin serwisu FoxyCare</h1>
        <p className="mt-2 text-sm text-gray-500">
          Wersja {TERMS_VERSION}, obowiązuje od {TERMS_EFFECTIVE_DATE}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700 sm:text-base">
          <Section title="§1. Postanowienia ogólne">
            <P>
              1.1. Niniejszy regulamin (dalej: „Regulamin”) określa zasady korzystania z serwisu
              internetowego FoxyCare, dostępnego pod adresem foxycare.app oraz jego subdomenami
              (dalej: „Serwis”).
            </P>
            <P>
              1.2. Operatorem Serwisu jest{' '}
              <span className="font-medium">
                [DO UZUPEŁNIENIA: pełna nazwa podmiotu / imię i nazwisko przedsiębiorcy, adres
                siedziby, NIP, REGON (jeśli dotyczy)]
              </span>{' '}
              (dalej: „Operator”). Adres e-mail do kontaktu i reklamacji:{' '}
              <span className="font-medium">[DO UZUPEŁNIENIA]</span>.
            </P>
            <P>
              1.3. Regulamin jest udostępniany nieodpłatnie pod adresem{' '}
              <Link href="/terms" className="text-brand-600 underline">
                foxycare.app/terms
              </Link>{' '}
              w formie umożliwiającej jego pozyskanie, odtwarzanie i utrwalanie, zgodnie z art. 8
              ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną.
            </P>
            <P>
              1.4. Do korzystania z Serwisu niezbędne są: urządzenie z dostępem do sieci Internet,
              aktualna przeglądarka internetowa obsługująca pliki cookies i JavaScript, a do
              założenia Konta — aktywny adres e-mail Użytkownika. Korzystanie z sieci Internet
              wiąże się z typowymi dla niej zagrożeniami (np. działanie złośliwego oprogramowania),
              przed którymi Użytkownik powinien zabezpieczyć się we własnym zakresie, w
              szczególności stosując aktualne oprogramowanie zabezpieczające.
            </P>
          </Section>

          <Section title="§2. Definicje">
            <Ul
              items={[
                <>
                  <b>Użytkownik</b> — osoba fizyczna posiadająca pełną zdolność do czynności
                  prawnych, która założyła Konto w Serwisie w roli Rodzica lub Niani.
                </>,
                <>
                  <b>Rodzic</b> — Użytkownik poszukujący opieki nad dzieckiem za pośrednictwem
                  Serwisu.
                </>,
                <>
                  <b>Niania</b> — Użytkownik oferujący usługi opiekuńcze za pośrednictwem Serwisu.
                </>,
                <>
                  <b>Ogłoszenie</b> — treść zamieszczona przez Nianię w Serwisie, zawierająca
                  ofertę świadczenia usług opiekuńczych.
                </>,
                <>
                  <b>Usługa opiekuńcza</b> — usługa sprawowania opieki nad dzieckiem, ustalana i
                  wykonywana wyłącznie pomiędzy Rodzicem a Nianią, poza Serwisem.
                </>,
                <>
                  <b>Konto</b> — zbiór zasobów i uprawnień przypisanych Użytkownikowi w Serwisie,
                  dostępny po rejestracji i zalogowaniu.
                </>,
              ]}
            />
          </Section>

          <Section title="§3. Charakter Serwisu">
            <P>
              3.1. Serwis jest wyłącznie platformą ogłoszeniową (tablicą ogłoszeń) o charakterze
              hostingowym w rozumieniu art. 14 ustawy o świadczeniu usług drogą elektroniczną oraz
              art. 6 rozporządzenia Parlamentu Europejskiego i Rady (UE) 2022/2065 (Akt o usługach
              cyfrowych, „DSA”). Serwis umożliwia Niani zamieszczenie Ogłoszenia, a Rodzicowi —
              jego wyszukanie, przeglądanie i nawiązanie kontaktu poprzez wbudowany czat.
            </P>
            <P>
              3.2. Operator{' '}
              <b>nie jest stroną</b> jakiejkolwiek umowy zawieranej pomiędzy Rodzicem a Nianią,{' '}
              <b>nie pośredniczy</b> w płatnościach za Usługi opiekuńcze, nie zatrudnia Niań, nie
              prowadzi działalności agencji opieki nad dziećmi ani nie gwarantuje zawarcia,
              wykonania czy jakości jakiejkolwiek Usługi opiekuńczej. Jedyną odpłatną usługą, jaką
              Operator świadczy we własnym imieniu, jest publikacja Ogłoszenia — zasady tej
              odpłatności określa §6.
            </P>
            <P>
              3.3. Wszelkie ustalenia dotyczące zakresu, terminu, wynagrodzenia i warunków
              świadczenia Usługi opiekuńczej Rodzic i Niania dokonują samodzielnie i na własną
              odpowiedzialność, poza Serwisem.
            </P>
          </Section>

          <Section title="§4. Rejestracja i Konto">
            <P>
              4.1. Założenie Konta wymaga podania prawdziwych danych oraz zaakceptowania
              niniejszego Regulaminu — akceptacja jest obowiązkowym elementem procesu rejestracji
              i warunkiem utworzenia Konta.
            </P>
            <P>
              4.2. Konto może założyć wyłącznie osoba pełnoletnia, posiadająca pełną zdolność do
              czynności prawnych.
            </P>
            <P>
              4.3. Użytkownik zobowiązany jest do zachowania danych logowania w poufności i nie
              udostępniania Konta osobom trzecim. Użytkownik ponosi odpowiedzialność za działania
              podjęte przy użyciu jego Konta.
            </P>
          </Section>

          <Section title="§5. Zasady zamieszczania Ogłoszeń">
            <P>
              5.1. Niania ponosi pełną odpowiedzialność za treść zamieszczanego Ogłoszenia,
              zgodność podanych informacji ze stanem faktycznym oraz zgodność treści z prawem.
            </P>
            <P>
              5.2. Zabronione jest zamieszczanie treści: niezgodnych z prawem, wprowadzających w
              błąd, naruszających dobra osobiste lub prawa osób trzecich, dyskryminujących, a
              także treści niezwiązanych z celem Serwisu.
            </P>
            <P>
              5.3. Operator, jako dostawca usługi hostingu, nie ma obowiązku uprzedniej,
              szczegółowej weryfikacji treści Ogłoszeń przed ich publikacją. Operator usuwa
              Ogłoszenie niezwłocznie po powzięciu wiarygodnej wiadomości o jego bezprawnym
              charakterze — zgłoszenia można kierować na adres wskazany w §1.2.
            </P>
          </Section>

          <Section title="§6. Płatności za publikację Ogłoszenia">
            <P>
              6.1. Publikacja Ogłoszenia przez Nianię jest odpłatna. Aktualny cennik jest dostępny
              pod adresem{' '}
              <span className="font-medium">[DO UZUPEŁNIENIA: link/miejsce cennika w Serwisie]</span>
              . Rodzic nie ponosi żadnych opłat na rzecz Operatora za korzystanie z Serwisu —
              przeglądanie Ogłoszeń, wyszukiwanie i korzystanie z czatu są dla Rodzica bezpłatne.
            </P>
            <P>
              6.2. Płatności są obsługiwane przez zewnętrznego dostawcę usług płatniczych:{' '}
              <span className="font-medium">
                [DO UZUPEŁNIENIA: nazwa operatora płatności, np. Przelewy24 / Stripe / PayU]
              </span>
              . Operator nie przechowuje danych kart płatniczych ani danych logowania do rachunków
              bankowych Użytkowników.
            </P>
            <P>
              6.3. Ogłoszenie zostaje opublikowane niezwłocznie po zaksięgowaniu płatności.
              Rozpoczęcie świadczenia usługi publikacji przed upływem 14-dniowego ustawowego
              terminu do odstąpienia od umowy następuje wyłącznie wtedy, gdy Niania — przed
              dokonaniem płatności — wyraźnie zażąda natychmiastowego rozpoczęcia świadczenia usługi
              oraz przyjmie do wiadomości utratę prawa odstąpienia od umowy z chwilą pełnego
              wykonania usługi przez Operatora (art. 38 pkt 1 w zw. z art. 12 ust. 1 pkt 12 ustawy z
              dnia 30 maja 2014 r. o prawach konsumenta). Bez złożenia takiego żądania Niani
              przysługuje prawo odstąpienia od umowy w terminie 14 dni bez podania przyczyny, na
              zasadach określonych w tej ustawie; postanowienia niniejszego paragrafu stosuje się
              odpowiednio także wtedy, gdy Niania nie jest konsumentem, lecz osobą fizyczną
              zawierającą umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści
              tej umowy wynika, że nie ma ona dla niej charakteru zawodowego (art. 7aa ustawy o
              prawach konsumenta).
            </P>
            <P>
              6.4. Opłata za publikację Ogłoszenia nie podlega zwrotowi w przypadku usunięcia
              Ogłoszenia lub zablokowania Konta z powodu naruszenia Regulaminu (§5.2, §9), co
              pozostaje bez wpływu na uprawnienia Użytkownika wynikające z bezwzględnie
              obowiązujących przepisów prawa.
            </P>
            <P>
              6.5. Reklamacje dotyczące płatności rozpatrywane są na zasadach określonych w §10
              (Reklamacje).
            </P>
          </Section>

          <Section title="§7. Brak weryfikacji Użytkowników — informacja kluczowa">
            <P>
              7.1. Serwis pełni wyłącznie funkcję tablicy ogłoszeń.{' '}
              <b>
                Operator nie weryfikuje tożsamości, kwalifikacji, doświadczenia, wykształcenia,
                niekaralności, stanu zdrowia, uprawnień ani wiarygodności Użytkowników
              </b>{' '}
              — ani Rodziców, ani Niań. Rejestracja Konta i publikacja Ogłoszenia, w tym jej
              odpłatny charakter, nie stanowią jakiegokolwiek potwierdzenia czy rekomendacji ze
              strony Operatora.
            </P>
            <P>
              7.2. Operator zdecydowanie rekomenduje, aby przed nawiązaniem współpracy każdy
              Użytkownik samodzielnie zweryfikował drugą stronę, w szczególności poprzez: okazanie
              dokumentu tożsamości, przedstawienie aktualnego zaświadczenia z Krajowego Rejestru
              Karnego, zebranie i sprawdzenie referencji, spotkanie osobiste przed rozpoczęciem
              opieki oraz ustalenie pisemnych warunków współpracy.
            </P>
            <P>
              7.3. Decyzja o nawiązaniu kontaktu i rozpoczęciu współpracy z inną osobą poznaną za
              pośrednictwem Serwisu należy wyłącznie do Użytkownika i jest podejmowana na jego
              własne ryzyko i odpowiedzialność.
            </P>
          </Section>

          <Section title="§8. Odpowiedzialność">
            <P>
              8.1. W najszerszym zakresie dopuszczalnym przez obowiązujące przepisy prawa, Operator
              nie ponosi odpowiedzialności za:
            </P>
            <Ul
              items={[
                'treść, prawdziwość i legalność Ogłoszeń zamieszczanych przez Użytkowników,',
                'jakość, legalność, bezpieczeństwo i sposób wykonania Usługi opiekuńczej ustalonej i świadczonej pomiędzy Rodzicem a Nianią,',
                'szkody majątkowe i niemajątkowe powstałe w związku z kontaktem, współpracą lub Usługą opiekuńczą nawiązaną za pośrednictwem Serwisu, w tym szkody wyrządzone dziecku, Rodzicowi lub Niani przez drugą stronę,',
                'działania i zaniechania Użytkowników, w tym czyny niedozwolone w rozumieniu art. 415 i nast. Kodeksu cywilnego, popełnione przez jednego Użytkownika wobec drugiego.',
              ]}
            />
            <P>
              8.2. Postanowień §8.1 nie stosuje się do szkód wyrządzonych Użytkownikowi umyślnie
              przez Operatora ani w innych przypadkach, w których wyłączenie lub ograniczenie
              odpowiedzialności byłoby nieważne na mocy bezwzględnie obowiązujących przepisów
              prawa, w tym art. 473 §2 oraz art. 385<sup>3</sup> Kodeksu cywilnego.
            </P>
            <P>
              8.3. Odpowiedzialność Operatora wobec Użytkowników za nienależyte świadczenie usługi
              Serwisu — w tym publikacji opłaconego Ogłoszenia zgodnie z §6 oraz dostępności
              technicznej Serwisu — jest ograniczona do zakresu dozwolonego przez przepisy prawa
              powszechnie obowiązującego.
            </P>
          </Section>

          <Section title="§9. Moderacja i blokowanie Kont">
            <P>
              9.1. Operator jest uprawniony, lecz nie zobowiązany, do moderowania, usuwania
              Ogłoszeń oraz blokowania Kont Użytkowników naruszających Regulamin lub przepisy
              prawa, w tym poprzez oznaczenie Konta jako zablokowane, co uniemożliwia dalsze
              logowanie.
            </P>
            <P>
              9.2. Podjęcie lub niepodjęcie działań moderacyjnych przez Operatora nie stanowi
              potwierdzenia ani zaprzeczenia prawdziwości treści Ogłoszenia czy wiarygodności
              Użytkownika i nie rodzi po stronie Operatora odpowiedzialności wobec pozostałych
              Użytkowników.
            </P>
          </Section>

          <Section title="§10. Reklamacje">
            <P>
              10.1. Reklamacje dotyczące funkcjonowania Serwisu, w tym płatności za publikację
              Ogłoszenia, można zgłaszać na adres e-mail wskazany w §1.2, podając opis zgłaszanego
              problemu.
            </P>
            <P>10.2. Operator rozpatruje reklamacje w terminie 14 dni od dnia ich otrzymania.</P>
            <P>
              10.3. Złożenie reklamacji nie jest równoznaczne z przyznaniem zwrotu opłaty za
              publikację Ogłoszenia — zasady odstąpienia od umowy i zwrotu opłaty określają
              wyłącznie §6.3–6.4. Reklamacja może natomiast dotyczyć np. nieprawidłowego działania
              Serwisu, błędu w pobraniu płatności lub niewykonania usługi publikacji przez
              Operatora.
            </P>
          </Section>

          <Section title="§11. Dane osobowe">
            <P>
              11.1. Administratorem danych osobowych Użytkowników jest Operator. Zasady
              przetwarzania danych osobowych określa odrębna{' '}
              <Link href="/privacy" className="text-brand-600 underline">
                Polityka Prywatności
              </Link>
              , sporządzona zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE)
              2016/679 (RODO).
            </P>
          </Section>

          <Section title="§12. Rozwiązanie umowy i usunięcie Konta">
            <P>
              12.1. Użytkownik może w każdej chwili zrezygnować z korzystania z Serwisu i
              samodzielnie usunąć swoje Konto w ustawieniach Konta (Mój profil → Usuń moje konto)
              — usunięcie następuje niezwłocznie i obejmuje profil, zdjęcie oraz wiadomości
              Użytkownika. Jeżeli zalogowanie nie jest możliwe (np. z powodu zablokowania Konta na
              podstawie §9), żądanie usunięcia można zgłosić na adres wskazany w §1.2 — Operator
              usunie Konto w takim przypadku.
            </P>
            <P>
              12.2. Operator może usunąć Konto Użytkownika w przypadku rażącego lub uporczywego
              naruszania Regulaminu, po uprzedniej próbie kontaktu z Użytkownikiem, chyba że
              charakter naruszenia uzasadnia niezwłoczne działanie.
            </P>
          </Section>

          <Section title="§13. Postanowienia końcowe">
            <P>13.1. Prawem właściwym dla niniejszego Regulaminu jest prawo polskie.</P>
            <P>
              13.2. Konsument ma możliwość skorzystania z pozasądowych sposobów rozpatrywania
              reklamacji i dochodzenia roszczeń, w tym z platformy ODR Komisji Europejskiej,
              dostępnej pod adresem{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </P>
            <P>
              13.3. Operator może zmienić Regulamin z ważnych przyczyn (zmiana przepisów prawa,
              zmiana funkcjonalności Serwisu, zmiana cennika). O zmianie Regulaminu Użytkownicy
              zostaną poinformowani z odpowiednim wyprzedzeniem. Do umów i akceptacji dokonanych
              przed zmianą stosuje się Regulamin w wersji obowiązującej w dniu akceptacji.
            </P>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  )
}
