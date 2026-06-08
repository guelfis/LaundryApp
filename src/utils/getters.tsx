import { getCleanStorageItem } from "../auth/authUtils";

export const getHouseholdTimezone = (): string => {
  return getCleanStorageItem('householdTimezone') || 'Europe/Zurich';
};