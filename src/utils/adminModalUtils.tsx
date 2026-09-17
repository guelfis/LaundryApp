import { Booking, HouseholdSlot } from "../lib/databaseTypes";

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
  currentDateSource: Date = new Date()
): HouseholdSlot[] {
  const todayStr = currentDateSource.toISOString().split('T')[0];
  const currentHour = currentDateSource.getHours();

  // 1. Filter out slots that have already finished if the day is today
  let slotsToFilter = masterSlots;
  if (dateStr === todayStr) {
    // Changing slot.start to slot.end keeps the current active slot open for selection
    slotsToFilter = masterSlots.filter(slot => slot.end > currentHour);
  }

  // 2. Filter out slots that the admin has already reserved
  const blockData = adminBlocksMap[dateStr];
  if (!blockData) return slotsToFilter;

  return slotsToFilter.filter(slot => 
    !blockData.blockedSlots.some(blocked => blocked[0] === slot.start && blocked[1] === slot.end)
  );
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