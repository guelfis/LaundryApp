import { supabase } from './supabase';
import type { HouseholdInsert, HouseholdUpdate } from './databaseTypes';

export async function getHouseholds() {
  const { data, error } = await supabase
    .from('household')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getHouseholdById(id: string) {
  const { data, error } = await supabase
    .from('household')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getHouseholdByAccessCode(accessCode: string) {
  const { data, error } = await supabase
    .from('household')
    .select('*')
    .eq('access_code', accessCode)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getHouseholdWithApartments(id: string) {
  const { data, error } = await supabase
    .from('household')
    .select('*, apartments:apartment(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createHousehold(payload: HouseholdInsert) {
  const { data, error } = await supabase
    .from('household')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHousehold(id: string, payload: HouseholdUpdate) {
  const { data, error } = await supabase
    .from('household')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHousehold(id: string) {
  const { error } = await supabase
    .from('household')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
