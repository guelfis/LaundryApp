import { Database } from "./database.types";

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

export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type ApartmentRole = Database["public"]["Enums"]["apartment_role"];

export interface Profile {
  id: string;
  full_name: string | null;
}

export interface ApartmentMember {
  user_id: string;
  role: string;
  profiles: Profile;
}