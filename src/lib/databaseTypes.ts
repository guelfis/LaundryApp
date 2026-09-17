import { useSearchHousehold } from "../hooks/useHousehold";
import { Database } from "./database.types";

export type Household = Database['public']['Tables']['household']['Row'];

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
  apartment_role: string | null;
  profiles: Profile;
}

// 1. Get the return type of the hook function
type UseSearchHouseholdResult = ReturnType<typeof useSearchHousehold>;

// 2. Extract the exact data type wrapped inside TanStack Query's result object
export type HouseholdData = NonNullable<UseSearchHouseholdResult['data']>;

export interface HouseholdSlot {
  id: string;
  start: number;
  end: number;
}

export interface SlotsPolicy {
  startHour: number;
  endHour: number;
  slots: HouseholdSlot[];
}