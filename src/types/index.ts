export type UserRole = 'parent' | 'nanny' | 'admin'
export type JobType = 'full_time' | 'part_time'
export type ChildrenAgeRange = 'under_1' | '1_3' | '4_6' | '7_11' | 'over_11'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_banned: boolean
  banned_at?: string
  last_seen_at?: string
  created_at: string
  updated_at: string
}

// A parent's profile IS her listing too, since foxycare-db migration 0032 —
// mirrors NannyProfile minus experience_years/price, which don't describe
// a family looking for care the way they describe a nanny offering it.
export interface ParentProfile {
  id: string
  user_id: string
  title?: string
  description?: string
  children_age_range?: ChildrenAgeRange[]
  job_type?: JobType[]
  location?: string
  avatar_url?: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

// A nanny has exactly one listing, and it IS her profile — see foxycare-db
// migration 0020. No separate ads table, no photo gallery (avatar_url is
// the only photo, shown wherever a listing is shown).
export interface NannyProfile {
  id: string
  user_id: string
  title?: string
  description?: string
  experience_years: number
  children_age_range?: ChildrenAgeRange[]
  job_type?: JobType[]
  location?: string
  price?: number
  avatar_url?: string
  is_published: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

// Mirrors the public.nanny_public_profiles view (foxycare-db migration
// 0021) — the anon-safe, published-only projection used by /search and
// the homepage, since public.users (where full_name lives) is
// authenticated-only for SELECT.
export interface NannyPublicProfile {
  id: string
  full_name: string
  avatar_url?: string
  location?: string
  experience_years?: number
  job_type?: JobType[]
  children_age_range?: ChildrenAgeRange[]
  description?: string
  title?: string
  price?: number
  published_at?: string
}

// Mirrors public.parent_public_profiles (foxycare-db migration 0032) — the
// authenticated-facing (not anon), published-only projection /search reads
// from when a nanny is browsing. No experience_years/price, unlike
// NannyPublicProfile.
export interface ParentPublicProfile {
  id: string
  full_name: string
  avatar_url?: string
  location?: string
  job_type?: JobType[]
  children_age_range?: ChildrenAgeRange[]
  description?: string
  title?: string
  published_at?: string
}

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_at?: string
  created_at: string
  other_user?: User
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at?: string
  sender?: User
}

// Mirrors public.report_reason / public.report_status (foxycare-db
// migration 0025).
export type ReportReason = 'inappropriate_content' | 'harassment' | 'fraud' | 'fake_profile' | 'other'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface ReportAttachment {
  id: string
  report_id: string
  storage_path: string
  file_name: string
  content_type?: string
  size_bytes?: number
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_id: string
  reason: ReportReason
  description: string
  status: ReportStatus
  resolved_by?: string
  resolved_at?: string
  created_at: string
}

// GET /api/admin/reports — enriched with the names admins need to triage a
// report, plus attachments with a short-lived signed URL each (the bucket
// isn't public, see foxycare-db migration 0025).
export interface AdminReportRow extends Report {
  reporter: { id: string; full_name: string; email: string } | null
  reported: { id: string; full_name: string; email: string; role: UserRole; is_banned: boolean } | null
  attachments: (ReportAttachment & { url: string | null })[]
}

export interface AdFilters {
  location?: string
  min_experience?: number
  max_experience?: number
  children_age_range?: ChildrenAgeRange[]
  job_type?: JobType[]
}

export interface AdminUserFilters {
  name?: string
  location?: string
  min_experience?: number
  children_age_range?: ChildrenAgeRange[]
  job_type?: JobType[]
}

export interface AdminUserRow extends User {
  profile?: (ParentProfile & Partial<NannyProfile>) | null
}
