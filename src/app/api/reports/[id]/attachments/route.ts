import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Attaches evidence-file metadata to a report the caller just created — the
// file itself is already in Storage by this point (uploaded directly from
// the browser, see uploadReportAttachment.ts). report_attachments_insert_own
// RLS (migration 0025) rejects this for any report the caller doesn't own,
// so a 500 here from a well-formed request generally means exactly that.
//
// No .select() after the insert, on purpose: report_attachments has no
// SELECT policy for the reporter (admin-only), and RLS applies the SELECT
// policy to INSERT...RETURNING too — the client already has everything it
// sent, so there's nothing worth reading back.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { storage_path, file_name, content_type, size_bytes } = await request.json()

  if (!storage_path || !file_name) {
    return NextResponse.json({ error: 'Brak danych załącznika' }, { status: 400 })
  }

  const { error } = await supabase
    .from('report_attachments')
    .insert({ report_id: id, storage_path, file_name, content_type, size_bytes })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
