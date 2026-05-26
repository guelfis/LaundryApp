import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createHouseholdAsLandlord } from '../lib/households';

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
      
      console.log(t('useHousehold.success'), data.access_code);
    },
    onError: (error: any) => {
      // Graceful error capturing fallback for standard logging monitors
      console.error(t('useHousehold.failure'), error);
    }
  });
}
