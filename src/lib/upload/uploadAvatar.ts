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
