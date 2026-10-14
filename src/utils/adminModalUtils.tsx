import { Slot } from "../hooks/useBookings";
import { HouseholdSlot } from "../lib/databaseTypes";
import { getBuildingCurrentDateTime } from "./datesGetter";
import { getHouseholdTimezone } from "./getters";
import { NormalizedBooking } from "./normalizeBookings";

export interface DayBlockSummary {
  blockedSlots: number[][];
  isFullyBooked: boolean;
}

export type AdminBlocksMap = Record<string, DayBlockSummary>;

/**
 * Checks whether a given slot interval overlaps with any blocked intervals.
 * Two intervals [A, B] and [C, D] overlap if Math.max(A, C) < Math.min(B, D).
 */
export function isSlotOverlappingBlocked(
  slotStart: number,
  slotEnd: number,
  blockedIntervals: number[][]
): boolean {
  return blockedIntervals.some(
    ([bStart, bEnd]) => Math.max(slotStart, bStart) < Math.min(slotEnd, bEnd)
  );
}

/**
 * Parses all admin bookings into a reactive data map and calculates constraints.
 */
export function processAdminBlocks(
  bookings: NormalizedBooking[],
  masterSlots: HouseholdSlot[],
  currentDateSource: Date = new Date() // Injectable for clean unit testing
) {
  const blocksMap: AdminBlocksMap = {};
  
  // 1. Pre-populate TODAY with slots that have already finished
  const timezone = getHouseholdTimezone();
  const buildingDateTime = getBuildingCurrentDateTime(timezone, currentDateSource);
  const todayStr = `${buildingDateTime.year}-${String(buildingDateTime.monthIndex + 1).padStart(2, '0')}-${String(buildingDateTime.day).padStart(2, '0')}`;
  const currentHour = buildingDateTime.hour;

  blocksMap[todayStr] = { blockedSlots: [], isFullyBooked: false };
  
  masterSlots.forEach(slot => {
    // If the slot end hour is less than or equal to the current hour, it's in the past
    if (slot.end <= currentHour) {
      blocksMap[todayStr].blockedSlots.push([slot.start, slot.end]);
    }
  });

  // 2. Map out active admin bookings from the database
  bookings.forEach((b) => {
    if (typeof b.startHour !== 'number' || typeof b.endHour !== 'number') return;
    if (b.status && b.status !== 'admin') return;
    if (b.released_at) return;
    if (!b.dateStr) return;
    
    // Extract hours cleanly from ISO strings
    const slotTuple = [b.startHour, b.endHour];

    if (!blocksMap[b.dateStr]) {
      blocksMap[b.dateStr] = { blockedSlots: [], isFullyBooked: false };
    }
    
    // Avoid duplicate tuple entries
    const alreadyExists = blocksMap[b.dateStr].blockedSlots.some(
      s => s[0] === b.startHour && s[1] === b.endHour
    );
    if (!alreadyExists) {
      blocksMap[b.dateStr].blockedSlots.push(slotTuple);
    }
  });

  // 3. Flag days that are completely full (either by database blocks or past time)
  Object.keys(blocksMap).forEach((dateStr) => {
    blocksMap[dateStr].isFullyBooked =
      masterSlots.length > 0 &&
      masterSlots.every(slot =>
        isSlotOverlappingBlocked(slot.start, slot.end, blocksMap[dateStr].blockedSlots)
      );
  });

  return blocksMap;
}

/**
 * Finds the closest fully booked admin date AFTER the selected start date.
 * This ensures the admin cannot create a range that spans across a fully blocked day.
 */
export function calculateMaxEndDate(startDate: string, blocksMap: AdminBlocksMap): string | undefined {
  if (!startDate) return undefined;

  const fullyBookedDates = Object.keys(blocksMap)
    .filter((dateStr) => blocksMap[dateStr].isFullyBooked)
    .sort();

  // Find the first fully booked date that occurs after our chosen start threshold
  const nextFullyBookedDate = fullyBookedDates.find((dateStr) => dateStr > startDate);
  
  return nextFullyBookedDate; // Pass this straight into the End Date picker's max attribute
}

export function toggleSlotInCollection(collection: HouseholdSlot[], slot: HouseholdSlot): HouseholdSlot[] {
  const exists = collection.some(s => s.start === slot.start && s.end === slot.end);
  
  if (exists) {
    return collection.filter(s => !(s.start === slot.start && s.end === slot.end));
  }
  
  return [...collection, slot];
}

/**
 * Filters out time slots that have already been reserved/blocked by the admin for a specific date.
 * 
 * @param dateStr The target date string (YYYY-MM-DD)
 * @param adminBlocksMap The dictionary mapping dates to their blocked slots summaries
 * @param masterSlots The static global array containing all possible time slots configurations
 * @returns An array of remaining available slots for the given date
 */
export function getAvailableSlotsForDate(
  dateStr: string,
  adminBlocksMap: AdminBlocksMap,
  masterSlots: HouseholdSlot[],
): HouseholdSlot[] {
  const timezone = getHouseholdTimezone();
  
  // 1. Get the current wall-clock date and hour EXACTLY at the building location
  const buildingDateTime = getBuildingCurrentDateTime(timezone);
  
  // Format today's date string using the building's calendar components (YYYY-MM-DD)
  const todayStr = `${buildingDateTime.year}-${String(buildingDateTime.monthIndex + 1).padStart(2, '0')}-${String(buildingDateTime.day).padStart(2, '0')}`;
  const currentHour = buildingDateTime.hour;

  // 2. Extract the blocked intervals tracked for this specific calendar day
  const dayData = adminBlocksMap[dateStr];
  const blockedIntervals = dayData ? dayData.blockedSlots : [];

  // 3. Filter the master slots using the synchronized building hour reference points
  return masterSlots.filter(slot => {
    // Scenario A: If the slot is scheduled for today, filter it out if it already ended at the building
    if (dateStr === todayStr && slot.end <= currentHour) {
      return false;
    }

    // Scenario B: Check if this slot overlaps any blocked interval recorded in adminBlocksMap
    const isBlocked = isSlotOverlappingBlocked(slot.start, slot.end, blockedIntervals);

    return !isBlocked;
  });
}

/**
 * Returns slots that have already passed for a given date in the building timezone.
 */
export function getPastSlotsForDate(
  dateStr: string,
  masterSlots: HouseholdSlot[],
  startDate: string | null = null,
  startSlot: HouseholdSlot | null = null
): HouseholdSlot[] {
  const timezone = getHouseholdTimezone();
  const buildingDateTime = getBuildingCurrentDateTime(timezone);
  const todayStr = `${buildingDateTime.year}-${String(buildingDateTime.monthIndex + 1).padStart(2, '0')}-${String(buildingDateTime.day).padStart(2, '0')}`;
  const currentHour = buildingDateTime.hour;

  if (dateStr < todayStr) {
    return [...masterSlots];
  }
  if (dateStr === todayStr) {
    return masterSlots.filter(slot => slot.end <= currentHour);
  }
  if (startDate) {
    // If dateStr is before the startDate altogether, all slots are "past / invalid"
    if (dateStr < startDate) {
      return [...masterSlots];
    }

    // If checking the exact same date as startDate (or an end date evaluating against startDate),
    // treat slots ending at or before the start hour as past/unavailable
    if (dateStr === startDate) {
      const startHour = startSlot ? startSlot.end : 0;
      return masterSlots.filter(slot => slot.start < startHour || slot.end <= startHour);
    }
  }
  return [];
}

/**
 * Calculates the first chronological date starting from today 
 * that has at least one remaining available slot (is not fully booked by admin).
 * 
 * @param adminBlocksMap The processed dictionary of administrative blocks
 * @param fallbackToday Optional anchor date used strictly for reliable unit testing execution
 * @returns A string representing the first available start date (YYYY-MM-DD)
 */
export function getFirstAvailableStartDate(
  adminBlocksMap: AdminBlocksMap,
  fallbackToday: Date = new Date()
): string {
  const timezone = getHouseholdTimezone();
  const b = getBuildingCurrentDateTime(timezone, fallbackToday);
  const checkDay = new Date(Date.UTC(b.year, b.monthIndex, b.day, 12, 0, 0));
  let dateStrToken = `${checkDay.getUTCFullYear()}-${String(checkDay.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDay.getUTCDate()).padStart(2, '0')}`;

  // Loop forward day by day. If the day is fully booked by the admin, step to the next calendar date
  while (adminBlocksMap[dateStrToken]?.isFullyBooked) {
    checkDay.setUTCDate(checkDay.getUTCDate() + 1);
    dateStrToken = `${checkDay.getUTCFullYear()}-${String(checkDay.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDay.getUTCDate()).padStart(2, '0')}`;
  }

  return dateStrToken;
}

export interface BookingPayload {
  apartmentId: string;
  dateStr: string;
  slotHours: Slot[];
  isAdminBlock: boolean;
}

export interface SlotConfig {
  start: number;
  end: number;
}

/**
 * Increments a standard "YYYY-MM-DD" date string by an explicit number of days,
 * cleanly side-stepping any native JavaScript timezone runtime translation bugs.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Using noon (12:00) provides a bulletproof padding buffer against daylight saving time shifts
  const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  targetDate.setUTCDate(targetDate.getUTCDate() + days);
  
  const y = targetDate.getUTCFullYear();
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getUTCDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
}

/**
 * Calculates all slots falling within a time period for a given day.
 */
export function getSlotsInPeriodForDate(
  dateStr: string,
  startDate: string,
  endDate: string,
  startSlot: SlotConfig,
  endSlot: SlotConfig,
  allSlotsConfig: HouseholdSlot[]
): HouseholdSlot[] {
  if (dateStr < startDate || dateStr > endDate) {
    return [];
  }

  // Sort all slots by start hour to ensure chronological order
  const sortedSlots = [...allSlotsConfig].sort((a, b) => a.start - b.start);

  if (startDate === endDate) {
    const periodStart = Math.min(startSlot.start, endSlot.start);
    const periodEnd = Math.max(startSlot.end, endSlot.end);
    return sortedSlots.filter(
      slot => slot.start >= periodStart && slot.end <= periodEnd
    );
  }

  if (dateStr === startDate) {
    return sortedSlots.filter(slot => slot.start >= startSlot.start);
  }

  if (dateStr === endDate) {
    return sortedSlots.filter(slot => slot.end <= endSlot.end);
  }

  // Intermediate days: all template slots are included
  return sortedSlots;
}

export interface CalculatePayloadsParams {
  apartmentId: string;
  isMultiDay: boolean;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string;   // Format: "YYYY-MM-DD"
  startSlot?: SlotConfig | null;
  endSlot?: SlotConfig | null;
  selectedStartSlots?: SlotConfig[];
  selectedEndSlots?: SlotConfig[];
  allSlotsConfig: HouseholdSlot[];
  adminBlocksMap?: AdminBlocksMap;
}

/**
 * Calculates the exact booking payloads required for single or multi-day admin blocks.
 * Operates on continuous time periods from startSlot to endSlot, skipping already-blocked slots.
 */
export function calculatePayloadsForBooking({
  apartmentId,
  isMultiDay,
  startDate,
  endDate,
  startSlot,
  endSlot,
  selectedStartSlots,
  selectedEndSlots,
  allSlotsConfig,
  adminBlocksMap,
}: CalculatePayloadsParams): BookingPayload[] {
  const payloads: BookingPayload[] = [];

  // Resolve effective startSlot
  let effectiveStartSlot = startSlot;
  if (!effectiveStartSlot && selectedStartSlots && selectedStartSlots.length > 0) {
    const sorted = [...selectedStartSlots].sort((a, b) => a.start - b.start);
    effectiveStartSlot = sorted[0];
  }

  // Resolve effective endSlot
  let effectiveEndSlot = endSlot;
  if (!effectiveEndSlot && selectedEndSlots && selectedEndSlots.length > 0) {
    const sorted = [...selectedEndSlots].sort((a, b) => a.end - b.end);
    effectiveEndSlot = sorted[sorted.length - 1];
  } else if (!effectiveEndSlot && selectedStartSlots && selectedStartSlots.length > 0) {
    const sorted = [...selectedStartSlots].sort((a, b) => a.end - b.end);
    effectiveEndSlot = sorted[sorted.length - 1];
  }

  if (!effectiveStartSlot || !effectiveEndSlot) {
    return payloads;
  }

  const filterAvailableSlots = (dateStr: string, candidateSlots: HouseholdSlot[]): Slot[] => {
    if (!adminBlocksMap || !adminBlocksMap[dateStr]) {
      return candidateSlots.map(slot => ({
        startHour: slot.start,
        endHour: slot.end,
      }));
    }

    const blockedIntervals = adminBlocksMap[dateStr].blockedSlots;
    return candidateSlots
      .filter(slot => !isSlotOverlappingBlocked(slot.start, slot.end, blockedIntervals))
      .map(slot => ({
        startHour: slot.start,
        endHour: slot.end,
      }));
  };

  const actualEndDate = isMultiDay ? endDate : startDate;
  let currentDateStr = startDate;

  // Loop safely until the date string sequentially advances past the target end date
  while (currentDateStr <= actualEndDate) {
    const candidateSlots = getSlotsInPeriodForDate(
      currentDateStr,
      startDate,
      actualEndDate,
      effectiveStartSlot,
      effectiveEndSlot,
      allSlotsConfig
    );

    const unblockedSlots = filterAvailableSlots(currentDateStr, candidateSlots);

    if (unblockedSlots.length > 0) {
      payloads.push({
        apartmentId,
        dateStr: currentDateStr,
        slotHours: unblockedSlots,
        isAdminBlock: true,
      });
    }

    currentDateStr = addDaysToDateString(currentDateStr, 1);
  }

  return payloads;
}