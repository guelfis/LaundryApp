import { supabase } from './supabase';
import type { BookingInsert, BookingUpdate } from './databaseTypes';

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

export async function createBooking(payload: BookingInsert) {
  const { data, error } = await supabase
    .from('booking')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBooking(id: string, payload: BookingUpdate) {
  const { data, error } = await supabase
    .from('booking')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(id: string) {
  const { error } = await supabase
    .from('booking')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
