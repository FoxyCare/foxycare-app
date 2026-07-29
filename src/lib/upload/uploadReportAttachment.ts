import type { SupabaseClient } from '@supabase/supabase-js'

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024 // 5 MB, matches the bucket's own cap
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export class AttachmentError extends Error {}

// Path convention {reporter_id}/{report_id}/{uuid}-{filename} — mirrors
// avatars' {auth.uid()}/... scoping so the same storage.foldername() RLS
// check works (see foxycare-db migration 0025). Unlike avatars, this bucket
// is private: only the uploader (insert) and admins (select) can touch it.
export async function uploadReportAttachment(
  supabase: SupabaseClient,
  reporterId: string,
  reportId: string,
  file: File
): Promise<{ storage_path: string; file_name: string; content_type: string; size_bytes: number }> {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AttachmentError(`Plik "${file.name}" jest za duży (maks. 5 MB).`)
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AttachmentError(`Plik "${file.name}" ma nieobsługiwany format.`)
  }

  const path = `${reporterId}/${reportId}/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage
    .from('report-attachments')
    .upload(path, file, { contentType: file.type })
  if (error) throw error

  return { storage_path: path, file_name: file.name, content_type: file.type, size_bytes: file.size }
}

// Deleting a user cascades their reports (filed and received) and, with
// them, the report_attachments metadata rows — but never the backing
// Storage objects (SQL DELETE only ever removes the metadata, not the
// file). Called before delete_user_account() by both /api/account
// (self-service) and /api/admin/users/[id]/delete (admin), same ordering
// as deleteAvatar() there. get_report_attachment_paths() (foxycare-db
// migration 0028) is a SECURITY DEFINER RPC because reports_select_own
// only covers reports the caller filed, not ones filed against them — a
// self-deleting reported user's own session otherwise couldn't see (and so
// couldn't clean up) attachments on reports about them.
export async function deleteReportAttachmentsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: paths, error } = await supabase.rpc('get_report_attachment_paths', {
    target_id: userId,
  })
  if (error) throw error
  if (!paths?.length) return

  const { error: removeError } = await supabase.storage.from('report-attachments').remove(paths)
  if (removeError) throw removeError
}
