import { supabase } from './supabase';
import type { ApartmentInsert, ApartmentUpdate } from './database.types';

export async function getApartmentsByHousehold(householdId: string) {
  const { data, error } = await supabase
    .from('apartment')
    .select('*')
    .eq('household_id', householdId)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data;
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
