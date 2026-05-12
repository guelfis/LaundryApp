export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      apartment: {
        Row: {
          created_at: string | null
          display_name: string
          household_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          household_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          household_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_invitations: {
        Row: {
          apartment_id: string
          created_at: string | null
          created_by: string
          current_uses: number | null
          expires_at: string
          id: string
          max_uses: number | null
        }
        Insert: {
          apartment_id: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          expires_at?: string
          id?: string
          max_uses?: number | null
        }
        Update: {
          apartment_id?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          expires_at?: string
          id?: string
          max_uses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "apartment_invitations_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_members: {
        Row: {
          apartment_id: string
          id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          apartment_id: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          apartment_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_members_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment"
            referencedColumns: ["id"]
          },
        ]
      }
      booking: {
        Row: {
          apartment_id: string | null
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          released_at: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          apartment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          released_at?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          apartment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          released_at?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household: {
        Row: {
          access_code: string
          address: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          access_code: string
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          access_code?: string
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_to_apartment: {
        Args: { h_code: string; target_apt_id: string }
        Returns: undefined
      }
      get_apartments_by_house_code: {
        Args: { h_code: string }
        Returns: {
          apt_id: string
          apt_name: string
        }[]
      }
      get_my_household_id: { Args: never; Returns: string }
      join_apartment_via_token: { Args: { token_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
