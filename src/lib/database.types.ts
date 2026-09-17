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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          household_id: string | null
          id: string
          max_uses: number | null
        }
        Insert: {
          apartment_id: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          expires_at?: string
          household_id?: string | null
          id?: string
          max_uses?: number | null
        }
        Update: {
          apartment_id?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          expires_at?: string
          household_id?: string | null
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
          {
            foreignKeyName: "apartment_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartment_invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
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
          notes: string | null
          released_at: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          apartment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          released_at?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          apartment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          released_at?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
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
          end_hour: number
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          slots: Json
          start_hour: number
          timezone: string
        }
        Insert: {
          access_code: string
          address?: string | null
          created_at?: string | null
          end_hour?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          slots?: Json
          start_hour?: number
          timezone?: string
        }
        Update: {
          access_code?: string
          address?: string | null
          created_at?: string | null
          end_hour?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          slots?: Json
          start_hour?: number
          timezone?: string
        }
        Relationships: []
      }
      join_requests: {
        Row: {
          apartment_id: string
          created_at: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          apartment_id: string
          created_at?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          apartment_id?: string
          created_at?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          apartment_id: string | null
          apartment_role: Database["public"]["Enums"]["apartment_role"] | null
          household_id: string
          household_role: Database["public"]["Enums"]["household_role"]
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          apartment_id?: string | null
          apartment_role?: Database["public"]["Enums"]["apartment_role"] | null
          household_id: string
          household_role?: Database["public"]["Enums"]["household_role"]
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          apartment_id?: string | null
          apartment_role?: Database["public"]["Enums"]["apartment_role"] | null
          household_id?: string
          household_role?: Database["public"]["Enums"]["household_role"]
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      support_tickets: {
        Row: {
          apartment_id: string | null
          app_version: string
          created_at: string
          household_id: string | null
          id: string
          message: string
          profile_id: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type_enum"]
          user_agent: string | null
        }
        Insert: {
          apartment_id?: string | null
          app_version: string
          created_at?: string
          household_id?: string | null
          id?: string
          message: string
          profile_id?: string | null
          ticket_type: Database["public"]["Enums"]["ticket_type_enum"]
          user_agent?: string | null
        }
        Update: {
          apartment_id?: string | null
          app_version?: string
          created_at?: string
          household_id?: string | null
          id?: string
          message?: string
          profile_id?: string | null
          ticket_type?: Database["public"]["Enums"]["ticket_type_enum"]
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      automated_self_deletion_process: { Args: never; Returns: undefined }
      book_laundry_slot:
        | {
            Args: {
              booking_date: string
              end_hour: number
              start_hour: number
              target_apartment_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              booking_date: string
              end_hour: number
              notes?: string
              requested_status?: string
              start_hour: number
              target_apartment_id: string
            }
            Returns: Json
          }
      create_household_as_landlord: {
        Args: {
          custom_end_hour: number
          custom_slots: Json
          custom_start_hour: number
          formatted_address: string
          household_name: string
          target_lat: number
          target_lng: number
          target_timezone: string
        }
        Returns: Json
      }
      create_join_request: {
        Args: { target_apartment_id: string }
        Returns: undefined
      }
      create_new_apartment: {
        Args: { apartment_name: string; target_household_id: string }
        Returns: Json
      }
      delete_and_leave_apartment: {
        Args: { target_apartment_id: string }
        Returns: undefined
      }
      delete_household: { Args: { target_household_id: string }; Returns: Json }
      generate_apartment_invite_link: {
        Args: {
          days_valid?: number
          max_slots?: number
          target_apartment_id: string
          target_household_id: string
        }
        Returns: string
      }
      get_apartments_by_house_code: {
        Args: { h_code: string }
        Returns: {
          apt_id: string
          apt_name: string
        }[]
      }
      get_my_household_id: { Args: never; Returns: string }
      handle_join_request: {
        Args: { action_status: string; request_id: string }
        Returns: undefined
      }
      handover_household_admin: {
        Args: { new_admin_user_id: string; target_household_id: string }
        Returns: Json
      }
      join_apartment_via_token: { Args: { token_id: string }; Returns: Json }
      leave_apartment: {
        Args: { target_apartment_id: string }
        Returns: undefined
      }
      leave_household: { Args: { target_household_id: string }; Returns: Json }
      release_laundry_slot: {
        Args: { target_booking_id: string }
        Returns: Json
      }
      remove_apartment_member: {
        Args: { target_apartment_id: string; target_user_id: string }
        Returns: undefined
      }
      search_household_by_coords: {
        Args: { search_lat: number; search_lng: number }
        Returns: {
          address: string
          id: string
          name: string
          timezone: string
        }[]
      }
      update_member_role:
        | {
            Args: {
              new_role: Database["public"]["Enums"]["apartment_role"]
              target_apartment_id: string
              target_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              new_role: string
              target_apartment_id: string
              target_user_id: string
            }
            Returns: undefined
          }
      verify_household_access_by_id: {
        Args: { target_id: string; user_input_code: string }
        Returns: {
          household_address: string
          household_id: string
          household_name: string
          success: boolean
        }[]
      }
    }
    Enums: {
      apartment_role: "admin" | "member"
      booking_status: "active" | "released" | "admin"
      household_role: "admin" | "member"
      ticket_type_enum: "bug" | "support"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      apartment_role: ["admin", "member"],
      booking_status: ["active", "released", "admin"],
      household_role: ["admin", "member"],
      ticket_type_enum: ["bug", "support"],
    },
  },
} as const
