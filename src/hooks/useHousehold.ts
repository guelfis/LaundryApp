import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createHouseholdAsLandlord, getUserHouseholds, searchHouseholdByCoords, verifyHouseholdAccessById } from '../lib/households';

interface CreateHouseholdVariables {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    // Explicit mutation executor binding pointing to our geographic Supabase API layer
    mutationFn: async (variables: CreateHouseholdVariables) => {
      return await createHouseholdAsLandlord(variables);
    },
    onSuccess: (data) => {
      // 1. Invalidate base infrastructure targets across the client runtime state tree
      queryClient.invalidateQueries({ queryKey: ['household-details', data.household_id] });
      queryClient.invalidateQueries({ queryKey: ['user-administered-buildings'] });
      
    },
    onError: (error: Error) => {
      // Graceful error capturing fallback for standard logging monitors
      console.error(t('useHousehold.failure'), error.message);
    }
  });
}

export function useGetUserHouselds(){
  return useQuery({
    queryKey: ["user-administered-buildings"],
    queryFn: () => getUserHouseholds(),
  });
}

export function useSearchHousehold(lat: number, lng: number, options: { enabled: boolean }) {
  return useQuery({
    queryKey: ["search-household", lat, lng],
    queryFn: () => searchHouseholdByCoords(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6))),
    enabled: options.enabled && lat !== 0 && lng !== 0,
    staleTime: 0, // Ensures clean network re-fetch execution on coordinate updates
  });
}

export function useVerifyHouseholdAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ householdId, inputCode }: { householdId: string; inputCode: string }) => 
      verifyHouseholdAccessById(householdId, inputCode),
    onSuccess: (data) => {
      if (data.success) {
        // CRITICAL: Tells React Query to wipe old caches and fetch fresh 
        // household lists now that the user successfully unlocked a new building!
        queryClient.invalidateQueries({ queryKey: ["user-households"] });
      }
    }
  });
}
