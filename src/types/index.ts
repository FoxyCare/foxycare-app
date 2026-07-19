export type UserRole = 'parent' | 'nanny'
export type JobType = 'full_time' | 'part_time'
export type ChildrenAgeRange = '0_3' | '3_6' | '6_plus'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ParentProfile {
  id: string
  user_id: string
  location?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface NannyProfile {
  id: string
  user_id: string
  experience_years: number
  children_age_range?: ChildrenAgeRange
  job_type?: JobType
  location?: string
  description?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Ad {
  id: string
  nanny_id: string
  title: string
  description?: string
  experience_years: number
  children_age_range?: ChildrenAgeRange
  job_type?: JobType
  location?: string
  price?: number
  created_at: string
  updated_at: string
  images?: AdImage[]
  nanny?: User
}

export interface AdImage {
  id: string
  ad_id: string
  image_url: string
  created_at: string
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

export interface AdFilters {
  location?: string
  min_experience?: number
  max_experience?: number
  children_age_range?: ChildrenAgeRange
  job_type?: JobType
}
