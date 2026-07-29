import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'

const SIGNED_URL_TTL_SECONDS = 600 // 10 min — long enough to review one report, short-lived by design

export async function GET(request: Request) {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('reports')
    .select(
      `*,
      reporter:users!reporter_id(id, full_name, email),
      reported:users!reported_id(id, full_name, email, role, is_banned),
      attachments:report_attachments(*)`
    )
    .order('created_at', { ascending: false })

  if (status === 'pending' || status === 'resolved' || status === 'dismissed') {
    query = query.eq('status', status)
  }

  const { data, error } = await query.limit(200)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // report-attachments is a private bucket (foxycare-db migration 0025) —
  // public URLs don't work, admins need a signed URL per file. Batched into
  // one createSignedUrls() call per request rather than one per attachment.
  const allPaths = data.flatMap((r) => r.attachments.map((a: { storage_path: string }) => a.storage_path))
  const signedUrlByPath = new Map<string, string>()
  if (allPaths.length) {
    const { data: signed } = await supabase.storage
      .from('report-attachments')
      .createSignedUrls(allPaths, SIGNED_URL_TTL_SECONDS)
    signed?.forEach((s) => {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? '', s.signedUrl)
    })
  }

  const reports = data.map((r) => ({
    ...r,
    attachments: r.attachments.map((a: { storage_path: string }) => ({
      ...a,
      url: signedUrlByPath.get(a.storage_path) ?? null,
    })),
  }))

  return NextResponse.json(reports)
}
