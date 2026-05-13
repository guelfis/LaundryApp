import { useQuery } from "@tanstack/react-query";
import { getApartmentsByHousehold, getMyApartments } from "./lib/apartments";

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