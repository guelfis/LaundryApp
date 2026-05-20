import { supabase } from './supabase';

export async function getBookingsByApartment(apartmentId: string) {
  const { data, error } = await supabase
    .from('booking')
    .select('*')
    .eq('apartment_id', apartmentId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getBookingsByHousehold(
  householdId: string, 
  startDate: string, 
  endDate: string
) {
  const { data, error } = await supabase
    .from('booking')
    .select('*, apartment!inner(household_id)')
    .eq('apartment.household_id', householdId)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('booking')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUpcomingBookings(apartmentId: string) {
  const { data, error } = await supabase
    .from('booking')
    .select('*')
    .eq('apartment_id', apartmentId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function bookLaundrySlot(apartmentId: string, dateStr: string, startH: number, endH: number) {
  const { data, error } = await supabase.rpc('book_laundry_slot', {
    target_apartment_id: apartmentId,
    booking_date: dateStr,
    start_hour: startH,
    end_hour: endH
  });

  if (error) throw error;
  return data as { booking_id: string; status: string };
}

export async function releaseLaundrySlot(bookingId: string) {
  const { data, error } = await supabase.rpc('release_laundry_slot', {
    target_booking_id: bookingId
  });

  if (error) throw error;
  return data as { action: 'deleted' | 'released'; message: string };
}
