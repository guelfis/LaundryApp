import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApartment, deleteApartment, generateInviteLink, getApartmentMembers, getApartmentsByHousehold, getMyApartments, getPendingRequests, joinApartmentViaLink, leaveApartment, promoteMember, removeMember, requestToJoinApartment, resolveJoinRequest } from "../lib/apartments";

export const useApartments = (householdId: string) => {

  return useQuery({
    // when the householdId changes, React Query will automatically refetch the data
    queryKey: ['household-apartments', householdId],
    queryFn: () => getApartmentsByHousehold(householdId),
    enabled: !!householdId,
  });
}

export function useMyApartments(householdId: string) {
  return useQuery({
    queryKey: ['my-apartments', householdId],
    queryFn: () => getMyApartments(householdId),
    enabled: !!householdId, // only run if householdId is truthy
  });
}

export function useApartmentMembers(apartmentId: string) {
  return useQuery({
    queryKey: ['apartment-members', apartmentId],
    queryFn: () => getApartmentMembers(apartmentId),
    enabled: !!apartmentId, // only run if apartmentId is truthy
  });
}

// Mutation: Request to join a locked apartment
export function useRequestToJoin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apartmentId: string) => requestToJoinApartment(apartmentId),
    onSuccess: () => {
      // Refresh the list of sent requests so the user can see their pending request immediately
      queryClient.invalidateQueries({ queryKey: ['my-sent-requests'] });
      // maybe add a toast or somthing here to confirm the request was sent successfully
    }
  });
}


// Mutation: Join directly using a copied token link
export function useJoinViaLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => joinApartmentViaLink(tokenId),
    onSuccess: (data) => {
      // 1. Save BOTH selections immediately to allow AppRoutes to pass the guard check!
      localStorage.setItem('householdId', data.household_id);
      localStorage.setItem('apartmentId', data.apartment_id);
      
      // 2. Refresh lists across both layout namespaces
      queryClient.invalidateQueries({ queryKey: ['my-apartments'] });
      queryClient.invalidateQueries({ queryKey: ['household-apartments'] });
    }
  });
}

// Hook: Fetch pending join requests for an admin dashboard
export function usePendingRequests(apartmentId: string) {
  return useQuery({
    queryKey: ['pending-requests', apartmentId],
    queryFn: () => getPendingRequests(apartmentId),
    enabled: !!apartmentId, 
    staleTime: 1000 * 60,   // 1 minute of staleness to reduce refetch frequency
  });
}

// Mutation: Generate a token link
export function useGenerateInviteLink() {
  return useMutation({
    mutationFn: ({ 
      apartmentId, 
      householdId,
      daysValid, 
      maxSlots 
    }: { 
      apartmentId: string; 
      householdId: string; 
      daysValid?: number; 
      maxSlots?: number; 
    }) => generateInviteLink(apartmentId, householdId, daysValid, maxSlots),
    onSuccess: (token) => {
      console.log('Dual-layered token generated successfully:', token);
    }
  });
}

// Mutation: Approve or reject a user request
export function useResolveJoinRequest(apartmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) => 
      resolveJoinRequest(requestId, action),
    onSuccess: () => {
      // Refresh the requests list and household state immediately
      queryClient.invalidateQueries({ queryKey: ['pending-requests', apartmentId] });
      queryClient.invalidateQueries({ queryKey: ['household-apartments'] });
    }
  });
}


export function useCreateApartment() {
  const queryClient =  useQueryClient();

  return useMutation({
    mutationFn: ({ name, householdId }: { name: string; householdId: string }) => 
      createApartment(name, householdId),
    onSuccess: () => {
      // Refresh both listings immediately so the new spot manifests under "My Apartments" and disappears from the general list
      queryClient.invalidateQueries({ queryKey: ['my-apartments'] });
      queryClient.invalidateQueries({ queryKey: ['household-apartments'] });
    }
  });
}

export function useApartmentMembersActions(apartmentId: string) {
  const queryClient = useQueryClient();

  // Mutation to promote a user to admin
  const promoteMemberMutation = useMutation({
    mutationFn: (targetUserId:string) => promoteMember(
      targetUserId, apartmentId
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-members', apartmentId] });
    }
  });

  // Mutation to remove a member
  const removeMemberMutation = useMutation({
    mutationFn: async (targetUserId:string) => removeMember(targetUserId, apartmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-members', apartmentId] });
    }
  });

  return {
    
    promoteMember: promoteMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync
  };
}

export function useDeleteOrLeaveApartment() {
  const queryClient = useQueryClient();

  // Mutation to leave apartment
  const leaveApartmentMutation = useMutation({
    mutationFn: (apartmentId:string) => leaveApartment(apartmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-apartments'] });
      localStorage.removeItem('apartmentId');
      localStorage.removeItem('apartmentName');
    }
  });

  const deleteApartmentMutation = useMutation({
    mutationFn: (apartmentId:string) => deleteApartment(apartmentId),
    onSuccess: () => {
      // Svuota i riferimenti dal browser immediatamente
      localStorage.removeItem('apartmentId');
      localStorage.removeItem('apartmentName');
      
      // Forza il refresh degli elenchi appartamenti globali per l'onboarding
      queryClient.invalidateQueries({ queryKey: ['my-apartments'] });
      queryClient.invalidateQueries({ queryKey: ['household-apartments'] });
    }
  });

  return {
    leaveApartment: leaveApartmentMutation.mutateAsync,
    isLeaving: leaveApartmentMutation.isPending,
    deleteApartment: deleteApartmentMutation.mutateAsync,
    isDeletingApartment: deleteApartmentMutation.isPending
  }
}