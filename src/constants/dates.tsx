import { HouseholdSlot } from "../lib/databaseTypes";

export const standardSlots:HouseholdSlot[] = [
  { id: "morning", start: 7, end: 12 },
  { id: "afternoon", start: 12, end: 17 },
  { id: "evening", start: 17, end: 22 }
];