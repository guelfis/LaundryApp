import { Slot } from "../hooks/useBookings";
import { Booking, HouseholdSlot } from "../lib/databaseTypes";
import { getBuildingCurrentDateTime } from "./datesGetter";
import { getHouseholdTimezone } from "./getters";

export interface DayBlockSummary {
  blockedSlots: number[][];
  isFullyBooked: boolean;
}

export type AdminBlocksMap = Record<string, DayBlockSummary>;

/**
 * Parses all admin bookings into a reactive data map and calculates constraints.
 */
export function processAdminBlocks(
  bookings: Booking[],
  masterSlots: HouseholdSlot[],
  currentDateSource: Date = new Date() // Injectable for clean unit testing
) {
  const blocksMap: AdminBlocksMap = {};
  
  // 1. Pre-populate TODAY with slots that have already finished
  const todayStr = currentDateSource.toISOString().split('T')[0];
  const currentHour = currentDateSource.getHours();

  blocksMap[todayStr] = { blockedSlots: [], isFullyBooked: false };
  
  masterSlots.forEach(slot => {
    // If the slot end hour is less than or equal to the current hour, it's in the past
    if (slot.end <= currentHour) {
      blocksMap[todayStr].blockedSlots.push([slot.start, slot.end]);
    }
  });

  // 2. Map out active admin bookings from the database
  bookings.forEach((b) => {
    if (!b.start_time || !b.end_time) return;

    const dateKey = b.start_time.split('T')[0];
    
    // Extract hours cleanly from ISO strings
    const startHourStr = b.start_time.split('T')[1]?.split(':')[0];
    const endHourStr = b.end_time.split('T')[1]?.split(':')[0];
    
    const startH = startHourStr ? parseInt(startHourStr, 10) : new Date(b.start_time).getHours();
    const endH = endHourStr ? parseInt(endHourStr, 10) : new Date(b.end_time).getHours();
    const slotTuple = [startH, endH];

    if (!blocksMap[dateKey]) {
      blocksMap[dateKey] = { blockedSlots: [], isFullyBooked: false };
    }
    
    // Avoid duplicate tuple entries
    const alreadyExists = blocksMap[dateKey].blockedSlots.some(
      s => s[0] === startH && s[1] === endH
    );
    if (!alreadyExists) {
      blocksMap[dateKey].blockedSlots.push(slotTuple);
    }
  });

  // 3. Flag days that are completely full (either by database blocks or past time)
  Object.keys(blocksMap).forEach((dateStr) => {
    if (blocksMap[dateStr].blockedSlots.length >= masterSlots.length) {
      blocksMap[dateStr].isFullyBooked = true;
    }
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

    // Scenario B: Check if this slot matches any blocked interval recorded in adminBlocksMap
    const isBlocked = blockedIntervals.some(
      blocked => blocked[0] === slot.start && blocked[1] === slot.end
    );

    return !isBlocked;
  });
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
  const checkDay = new Date(fallbackToday);
  let dateStrToken = checkDay.toISOString().split('T')[0];

  // Loop forward day by day. If the day is fully booked by the admin, step to the next calendar date
  while (adminBlocksMap[dateStrToken]?.isFullyBooked) {
    checkDay.setDate(checkDay.getDate() + 1);
    dateStrToken = checkDay.toISOString().split('T')[0];
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

interface CalculatePayloadsParams {
  apartmentId: string;
  isMultiDay: boolean;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string;   // Format: "YYYY-MM-DD"
  selectedStartSlots: { start: number; end: number }[];
  selectedEndSlots: { start: number; end: number }[];
  allSlotsConfig: SlotConfig[];
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
 * Calculates the exact booking payloads required for single or multi-day admin blocks.
 * Operates purely on layout string evaluations to preserve localized building integrity.
 */
export function calculatePayloadsForBooking({
  apartmentId,
  isMultiDay,
  startDate,
  endDate,
  selectedStartSlots,
  selectedEndSlots,
  allSlotsConfig,
}: CalculatePayloadsParams): BookingPayload[] {
  const payloads: BookingPayload[] = [];

  // CASE A: Single Day Block
  if (!isMultiDay) {
    const slots: Slot[] = selectedStartSlots.map(slot => ({
      startHour: slot.start,
      endHour: slot.end
    }));

    if (slots.length > 0) {
      payloads.push({ apartmentId, dateStr: startDate, slotHours: slots, isAdminBlock: true });
    }
    return payloads;
  }

  // CASE B: Multi-Day Range Block
  let currentDateStr = startDate;

  // Loop safely until the date string sequentially advances past the target end date
  while (currentDateStr <= endDate) {
    const slotsForThisDay: Slot[] = [];

    if (currentDateStr === startDate) {
      // 1. Initial boundary day: Apply only selected start slots (e.g., evening slots)
      selectedStartSlots.forEach(slot => {
        slotsForThisDay.push({ startHour: slot.start, endHour: slot.end });
      });
    } else if (currentDateStr === endDate) {
      // 2. Final boundary day: Apply only selected end slots (e.g., morning slots)
      selectedEndSlots.forEach(slot => {
        slotsForThisDay.push({ startHour: slot.start, endHour: slot.end });
      });
    } else {
      // 3. Intermediate days: Block all template system slots entirely
      allSlotsConfig.forEach(slotConfig => {
        slotsForThisDay.push({ startHour: slotConfig.start, endHour: slotConfig.end });
      });
    }

    if (slotsForThisDay.length > 0) {
      payloads.push({
        apartmentId,
        dateStr: currentDateStr,
        slotHours: slotsForThisDay,
        isAdminBlock: true,
      });
    }

    // Step ahead exactly 1 calendar day string
    currentDateStr = addDaysToDateString(currentDateStr, 1);
  }

  return payloads;
}