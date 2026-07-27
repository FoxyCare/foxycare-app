import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReportReason } from '@/types'

const VALID_REASONS: ReportReason[] = [
  'inappropriate_content',
  'harassment',
  'fraud',
  'fake_profile',
  'other',
]

// Self-service report submission — foxycare-db migration 0025's
// reports_insert_own RLS policy is the real boundary (reporter_id must be
// the caller); this route validates shape and returns the created row's id
// so the client can then attach evidence files to it.
//
// The id is generated here rather than left to the column default and read
// back via .select() to sidestep a subtlety of INSERT...RETURNING under
// RLS (still true even though reports_select_own, migration 0027, would
// actually make .select() work today — no need to depend on that).
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { reported_id, reason, description } = await request.json()

  if (!reported_id || typeof reported_id !== 'string') {
    return NextResponse.json({ error: 'Brak zgłaszanego użytkownika' }, { status: 400 })
  }
  if (reported_id === user.id) {
    return NextResponse.json({ error: 'Nie możesz zgłosić samego siebie' }, { status: 400 })
  }
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Nieprawidłowy powód zgłoszenia' }, { status: 400 })
  }
  if (typeof description !== 'string' || !description.trim()) {
    return NextResponse.json({ error: 'Opis zgłoszenia jest wymagany' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const { error } = await supabase
    .from('reports')
    .insert({ id, reporter_id: user.id, reported_id, reason, description: description.trim() })

  if (error) {
    // Raised by trg_reports_rate_limit (foxycare-db migration 0028) — the
    // real enforcement is the DB trigger, this just turns its exception
    // into a friendly, correctly-coded response instead of a bare 500.
    if (error.message.includes('rate_limited_pair')) {
      return NextResponse.json(
        { error: 'Już zgłosiłeś tego użytkownika w ciągu ostatnich 24 godzin.' },
        { status: 429 }
      )
    }
    if (error.message.includes('rate_limited_global')) {
      return NextResponse.json(
        { error: 'Osiągnięto limit zgłoszeń. Spróbuj ponownie za jakiś czas.' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id }, { status: 201 })
}
