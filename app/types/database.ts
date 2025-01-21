export type Database = {
  public: {
    Tables: {
      // Add your Supabase tables here
      // For example:
      // profiles: {
      //   Row: {
      //     id: string
      //     email: string
      //     name: string | null
      //   }
      //   Insert: {
      //     id: string
      //     email: string
      //     name?: string | null
      //   }
      //   Update: {
      //     id?: string
      //     email?: string
      //     name?: string | null
      //   }
      // }
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