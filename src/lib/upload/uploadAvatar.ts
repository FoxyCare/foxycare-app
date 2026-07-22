import type { SupabaseClient } from '@supabase/supabase-js'
import { compressImage } from './compressImage'

// One object per user at {uid}/avatar.<ext>, overwritten on re-upload — see
// foxycare-db migration 0018 for the bucket + RLS. The `v=` query param
// busts any browser/CDN cache now that the path itself never changes.
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const blob = await compressImage(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: blob.type,
  })
  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

// Used by account deletion (self-service and admin) — removes the backing
// Storage object(s) via the Storage API before the account row is deleted.
// A raw SQL DELETE on storage.objects would only remove the metadata row,
// not the actual file, so this has to go through supabase.storage, not a DB
// migration (see foxycare-db migration 0022's comment on the same point).
export async function deleteAvatar(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: files } = await supabase.storage.from('avatars').list(userId)
  if (!files?.length) return

  const paths = files.map((f) => `${userId}/${f.name}`)
  const { error } = await supabase.storage.from('avatars').remove(paths)
  if (error) throw error
}
