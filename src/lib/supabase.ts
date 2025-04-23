import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for public/anonymous access
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for privileged operations (only use server-side)
export const supabaseService = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase // Fallback to anon client if no service key

// Types for our service_tasks table
export interface ServiceTask {
  id: string
  request_type: 'ROOM_SERVICE' | 'DINING_BOOKING' | 'SPA_BOOKING'
  guest_phone_number: string
  room_no?: string | null
  request_details: string
  guest_name?: string | null
  guest_preferences_summary?: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NEEDS_INFO'
  created_at: string
  updated_at: string
  completed_at?: string | null
  assigned_to?: string | null
  internal_notes?: string | null
  suggestion_text?: string | null
  notified_on_completion: boolean
}

export interface UserLocation {
  id: string
  user_id: string
  user_name?: string | null
  lat: number
  lng: number
  last_updated: string
  is_active: boolean
}
