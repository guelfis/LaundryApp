import { useMemo } from "react";

export function useTravelingInfo(householdTimezone: string) {
  return useMemo(() => {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; 
      return {
        isTraveling: userTimezone !== householdTimezone,
        userTimezone
      };
    }, [householdTimezone]);
}