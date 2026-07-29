import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/requireAdmin'
import { logAdminAction } from '@/lib/admin/logAdminAction'

// Marks a report as dismissed — no violation found / no action warranted.
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
    .update({ status: 'dismissed', resolved_by: adminCheck, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select('reported_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAdminAction(supabase, adminCheck, report.reported_id, 'dismiss_report')
  return NextResponse.json({ success: true })
}
