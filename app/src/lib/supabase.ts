import { createClient } from '@supabase/supabase-js'

// These will be environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  // Define your database schema here when ready
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          name: string
          peer_id: string
          public_key: string
          created_at: string
          last_seen?: string
        }
        Insert: {
          id?: string
          name: string
          peer_id: string
          public_key: string
          created_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          name?: string
          peer_id?: string
          public_key?: string
          created_at?: string
          last_seen?: string
        }
      }
    }
  }
}