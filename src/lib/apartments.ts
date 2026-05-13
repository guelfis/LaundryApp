import { supabase } from './supabase';
import type { Apartment, ApartmentInsert, ApartmentUpdate } from './databaseTypes';

export async function getApartmentsByHousehold(householdId: string) {
  const { data, error } = await supabase
    .from('apartment')
    .select('*')
    .eq('household_id', householdId)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getMyApartments(householdId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user found");

  const { data, error } = await supabase
  .from('apartment_members')
  .select(`
    role,
    apartment:apartment_id (
      id,
      display_name,
      household_id
    )
  `)
  .eq('user_id', user.id) // filter by current user
  .eq('apartment.household_id', householdId);
  
  if (error) throw error;
  
  // Clean up the response to return a flatter structure if preferred
  return (data?.map(m => m.apartment) || []) as Apartment[]
}

export async function getApartmentById(id: string) {
  const { data, error } = await supabase
    .from('apartment')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getApartmentWithBookings(id: string) {
  const { data, error } = await supabase
    .from('apartment')
    .select('*, bookings:booking(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createApartment(payload: ApartmentInsert) {
  const { data, error } = await supabase
    .from('apartment')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateApartment(id: string, payload: ApartmentUpdate) {
  const { data, error } = await supabase
    .from('apartment')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteApartment(id: string) {
  const { error } = await supabase
    .from('apartment')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
