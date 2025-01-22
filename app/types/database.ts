export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          created_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          user_id: string
          workspace_id: string
          role: 'admin' | 'agent'
          permissions: string[]
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id: string
          role: 'admin' | 'agent'
          permissions?: string[]
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string
          role?: 'admin' | 'agent'
          permissions?: string[]
          joined_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          workspace_id: string
          subject: string
          description: string
          email: string
          status: string
          priority: string
          chat_room_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          subject: string
          description: string
          email: string
          status?: string
          priority?: string
          chat_room_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          subject?: string
          description?: string
          email?: string
          status?: string
          priority?: string
          chat_room_id?: string | null
          created_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          ticket_id: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          status?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          content: string
          sender_type: 'customer' | 'agent'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          content: string
          sender_type: 'customer' | 'agent'
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          content?: string
          sender_type?: 'customer' | 'agent'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 