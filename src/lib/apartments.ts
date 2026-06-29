import { supabase } from './supabase';
import type { Apartment, ApartmentUpdate } from './databaseTypes';

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
    .from('memberships') 
    .select(`
      apartment_role, 
      apartment:apartment_id (
        id,
        display_name,
        household_id
      )
    `)
    .eq('user_id', user.id)
    .eq('household_id', householdId)
    .not('apartment_id', 'is', null); // 4. Ignore rows where they are only a household member

  if (error) throw error;

  // 5. Clean up the response to return a flatter structure matching your exact style
  return (data?.map(m => m.apartment) || []) as Apartment[];
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

export async function createApartment(name: string, householdId: string) {
  const { data, error } = await supabase.rpc('create_new_apartment', {
    apartment_name: name,
    target_household_id: householdId
  });

  if (error) throw error;
  return data as { apartment_id: string; display_name: string; status: string };
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

//  Get Members of an Apartment with User Profiles
export async function getApartmentMembers(apartmentId: string) {
  const { data, error } = await supabase
    .from('memberships') 
    .select(`
      apartment_role,  
      user_id,
      profiles:user_id (
        id,
        full_name
      )
    `)
    .eq('apartment_id', apartmentId)
    .not('apartment_id', 'is', null); 

  if (error) throw error;
  return data;
}

// Trigger a Request to Join a specific locked apartment
export async function requestToJoinApartment(apartmentId: string) {
  const { error } = await supabase.rpc('create_join_request', {
    target_apartment_id: apartmentId
  });

  if (error) throw error;
  return { success: true };
}

//  Handle an invitation link automatically when the app boots with a token
export async function joinApartmentViaLink(tokenId: string) {
  const { data, error } = await supabase.rpc('join_apartment_via_token', {
    token_id: tokenId
  });

  if (error) throw error;
  return data as { apartment_id: string; household_id: string; status: string };
}

// Generate an invitation link token (Admin only)
export async function generateInviteLink(apartmentId: string, householdId: string, daysValid: number = 7, maxSlots: number = 5) {
  const { data, error } = await supabase.rpc('generate_apartment_invite_link', {
    target_apartment_id: apartmentId,
    target_household_id: householdId,
    days_valid: daysValid,
    max_slots: maxSlots
  });

  if (error) throw error;
  
  // Returns the unique UUID token string
  return data as string; 
}

// Approve or decline a pending join request (Admin only)
export async function resolveJoinRequest(requestId: string, action: 'approved' | 'rejected') {
  const { error } = await supabase.rpc('handle_join_request', {
    request_id: requestId,
    action_status: action
  });

  if (error) throw error;
  return { success: true };
}

// Get all pending requests for an apartment (Admin only)
export async function getPendingRequests(apartmentId: string) {
  const { data, error } = await supabase
    .from('join_requests')
    .select(`
      id,
      status,
      created_at,
      user_id,
      profiles:user_id (
        full_name
      )
    `)
    .eq('apartment_id', apartmentId)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
}

export async function leaveApartment(apartmentId:string){
  const { error } = await supabase.rpc('leave_apartment', { target_apartment_id: apartmentId });
  if (error) throw error;
  return {success:true};
}

export async function promoteMember(targetUserId: string, apartmentId: string){
  const { error } = await supabase.rpc('update_member_role', {
        target_apartment_id: apartmentId,
        target_user_id: targetUserId,
        new_role: 'admin'
      });
  if (error) throw error;
  return {success:true};
}

export async function removeMember(targetUserId: string, apartmentId: string){
  const { error } = await supabase.rpc('remove_apartment_member', {
        target_apartment_id: apartmentId,
        target_user_id: targetUserId
      });
    if (error) throw error;
    return {success:true};
}

export async function deleteApartment(apartmentId:string){
  const { error } = await supabase.rpc('delete_and_leave_apartment', { 
        target_apartment_id: apartmentId 
      });
  if (error) throw error;
  return {success:true};
}

export const updateApartmentName = async (apartmentId: string, newName: string): Promise<void> => {
  const { error } = await supabase
    .from('apartment') 
    .update({ display_name: newName })
    .eq('id', apartmentId);

  if (error) {
    throw new Error(error.message || 'Failed to update apartment name.');
  }
};