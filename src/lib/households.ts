import { standardSlots } from '../constants/dates';
import { HouseholdSlot, SlotsPolicy } from './databaseTypes';
import { supabase } from './supabase';

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

interface CreateHouseholdParams {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  timezone: string; // Dynamic text value from maps API (e.g., 'Europe/Zurich')
}

export async function createHouseholdAsLandlord({
  name,
  formattedAddress,
  latitude,
  longitude,
  timezone
}: CreateHouseholdParams) {
  const { data, error } = await supabase.rpc('create_household_as_landlord', {
    household_name: name,
    formatted_address: formattedAddress,
    target_lat: latitude,
    target_lng: longitude,
    target_timezone: timezone,
    // TODO: remove hardcoded values and make them dynamic based on user input or configuration
    custom_start_hour: 7,
    custom_end_hour: 22,
    custom_slots: JSON.stringify(standardSlots)
  });

  if (error) throw error;
  return data as { status: string; household_id: string; access_code: string; message: string };
}

export async function getUserHouseholds() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No authenticated user found");

  const { data, error } = await supabase
    .from("memberships") 
    .select(`
      household_id, 
      household_role,    
      apartment_id,      
      apartment_role,    
      household:household_id (
        name, 
        address, 
        timezone
      )
    `)
    .eq("user_id", user.id);
        
  if (error) throw error;
  
  // 3. Ritorna i dati. Struttura identica a prima ma con 'household_role' al posto di 'role'
  return data || [];
}


export async function searchHouseholdByCoords(lat: number, lng: number) {
  const { data, error } = await supabase.rpc('search_household_by_coords', {
    search_lat: lat,
    search_lng: lng
  });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null; // Return the matched row or null
}

export async function verifyHouseholdAccessById(householdId: string, inputCode: string) {
  const { data, error } = await supabase.rpc('verify_household_access_by_id', {
    target_id: householdId,
    user_input_code: inputCode
  });

  if (error) throw error;
  return data && data.length > 0 ? data[0] : { success: false };
}

export async function deleteHousehold(householdId: string){
  const {error} = await supabase.rpc('delete_household', {
    target_household_id: householdId
  });
  if (error) throw error;
  return {success:true};
}

export async function leaveHousehold(householdId: string){
  const {error} = await supabase.rpc('leave_household', {
    target_household_id: householdId
  });
  if (error) throw error;
  return {success:true};
}

export async function getHouseholdMembers(householdId: string) {
  const { data, error } = await supabase
    .from('memberships') 
    .select(`
      household_role,  
      user_id,
      profiles:user_id (
        id,
        full_name
      )
    `)
    .eq('household_id', householdId);

  if (error) throw error;
  return data;
}

export async function getHouseholdSlotsPolicy(householdId: string): Promise<SlotsPolicy | null> {
  const { data, error } = await supabase
    .from('household')
    .select('start_hour, end_hour, slots')
    .eq('id', householdId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // 2. Unpack and map the database snake_case keys into your frontend camelCase structure
  return {
    startHour: data.start_hour,
    endHour: data.end_hour,
    // Explicitly cast the generic Json field to your clean runtime Slot array type
    slots: data.slots as unknown as HouseholdSlot[]
  };
}