import type { SupabaseClient } from '@supabase/supabase-js'

// Accountability log (RODO Art. 32) — see foxycare-db migration 0022. Errors
// are swallowed on purpose: a logging failure shouldn't block the underlying
// moderation action from completing (and RLS already guarantees only an
// admin acting as themselves can ever insert a row here anyway).
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  targetUserId: string,
  action: 'ban' | 'unban' | 'publish' | 'unpublish' | 'delete_account'
): Promise<void> {
  await supabase.from('admin_actions').insert({
    admin_id: adminId,
    target_user_id: targetUserId,
    action,
  })
}
