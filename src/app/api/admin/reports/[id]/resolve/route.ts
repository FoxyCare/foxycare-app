import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { logAdminAction } from '@/lib/admin/logAdminAction'

// Marks a report as resolved — used once the admin has acted on it (e.g.
// banned the reported user via the existing /api/admin/users/[id]/ban).
// Banning itself is a separate call from the admin UI, not triggered here,
// since not every resolved report ends in a ban.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (adminCheck instanceof NextResponse) return adminCheck

  const { data: report, error } = await supabase
    .from('reports')
    .update({ status: 'resolved', resolved_by: adminCheck, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select('reported_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(supabase, adminCheck, report.reported_id, 'resolve_report')
  return NextResponse.json({ success: true })
}
