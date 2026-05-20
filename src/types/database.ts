export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          country: string | null
          bio: string | null
          banner_url: string | null
          background_url: string | null
          favorite_anime_id: number | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          country?: string | null
          bio?: string | null
          banner_url?: string | null
          background_url?: string | null
          favorite_anime_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          country?: string | null
          bio?: string | null
          banner_url?: string | null
          background_url?: string | null
          favorite_anime_id?: number | null
          created_at?: string
        }
      }
      anime_collection: {
        Row: {
          id: string
          user_id: string
          anime_id: number
          source: string
          status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped'
          rating: number | null
          review: string | null
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          anime_id: number
          source?: string
          status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped'
          rating?: number | null
          review?: string | null
          added_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          anime_id?: number
          source?: string
          status?: 'watching' | 'completed' | 'plan_to_watch' | 'dropped'
          rating?: number | null
          review?: string | null
          added_at?: string
          updated_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          created_at?: string
          read_at?: string | null
        }
      }
      custom_playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      playlist_items: {
        Row: {
          id: string
          playlist_id: string
          anime_id: number
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          anime_id: number
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          anime_id?: number
          added_at?: string
        }
      }
      profile_comments: {
        Row: {
          id: string
          profile_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}
