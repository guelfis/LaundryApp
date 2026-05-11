import { useQuery } from "@tanstack/react-query";
import { getApartmentsByHousehold } from "./lib/apartments";

export const useApartments = (householdId: string) => {

  return useQuery({
    // when the householdId changes, React Query will automatically refetch the data
    queryKey: ['apartments', householdId], 
    queryFn: () => getApartmentsByHousehold(householdId),
  });
}