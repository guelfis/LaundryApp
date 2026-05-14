import { useQuery } from "@tanstack/react-query";
import { getApartmentMembers, getApartmentsByHousehold, getMyApartments } from "./lib/apartments";

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

export default function useApartmentMembers(apartmentId: string) {
  return useQuery({
    queryKey: ['apartment-members', apartmentId],
    queryFn: () => getApartmentMembers(apartmentId),
    enabled: !!apartmentId, // only run if apartmentId is truthy
  });
}