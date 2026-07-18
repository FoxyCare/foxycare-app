export type UserRole = 'parent' | 'nanny'

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  avatar_url?: string
  bio?: string
  location?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface NannyProfile extends Profile {
  role: 'nanny'
  hourly_rate?: number
  experience_years?: number
  certifications?: string[]
  availability?: AvailabilitySlot[]
  rating?: number
  total_reviews?: number
}

export interface ParentProfile extends Profile {
  role: 'parent'
  children_count?: number
  children_ages?: number[]
}

export interface AvailabilitySlot {
  day: string
  start_time: string
  end_time: string
}

export interface Booking {
  id: string
  parent_id: string
  nanny_id: string
  status: BookingStatus
  start_time: string
  end_time: string
  hourly_rate: number
  total_amount?: number
  notes?: string
  created_at: string
  updated_at: string
  parent?: Profile
  nanny?: Profile
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Conversation {
  id: string
  participant_ids: string[]
  created_at: string
  updated_at: string
  last_message?: Message
  other_participant?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at?: string
  sender?: Profile
}

export interface SearchFilters {
  location?: string
  min_rate?: number
  max_rate?: number
  min_experience?: number
  certifications?: string[]
  availability_day?: string
  rating?: number
}
