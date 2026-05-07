export interface Database {
  public: {
    Tables: {
      household: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          access_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          access_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          access_code?: string;
          created_at?: string;
        };
      };
      apartment: {
        Row: {
          id: string;
          household_id: string | null;
          display_name: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id?: string | null;
          display_name: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string | null;
          display_name?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
      booking: {
        Row: {
          id: string;
          apartment_id: string | null;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          apartment_id?: string | null;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          apartment_id?: string | null;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Household = Database['public']['Tables']['household']['Row'];
export type HouseholdInsert = Database['public']['Tables']['household']['Insert'];
export type HouseholdUpdate = Database['public']['Tables']['household']['Update'];

export type Apartment = Database['public']['Tables']['apartment']['Row'];
export type ApartmentInsert = Database['public']['Tables']['apartment']['Insert'];
export type ApartmentUpdate = Database['public']['Tables']['apartment']['Update'];

export type Booking = Database['public']['Tables']['booking']['Row'];
export type BookingInsert = Database['public']['Tables']['booking']['Insert'];
export type BookingUpdate = Database['public']['Tables']['booking']['Update'];

export type ApartmentWithBookings = Apartment & { bookings: Booking[] };
export type HouseholdWithApartments = Household & { apartments: Apartment[] };
