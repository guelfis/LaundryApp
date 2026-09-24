import { SlotStatus } from '../constants/SlotStatus';
import { Booking, HouseholdSlot, SlotsPolicy } from '../lib/databaseTypes';
import i18n from '../locales/i18n';
import { getBuildingHour, getDateString } from './datesGetter';
import { getHouseholdTimezone } from './getters';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format standard string dictionary mapping reference token: "2026-5-25-17"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};

/**
 * Resolves the dynamic localized unique slotKey identifier for the current moment based on the building's clock.
 * Returns null if the current hour falls outside of operational boundaries (e.g., at night).
 */
export const getCurrentSlotKey = (slots: HouseholdSlot[]): string | null => {
  const today = new Date();
  const timezone = getHouseholdTimezone();
  
  // 1. Convert the universal current moment into the exact time matching the building's physical wall-clock [google:4]
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
  });
  
  const parts = formatter.formatToParts(today);
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const monthIndex = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // Reverts to 0-indexed format
  const dayNum = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  const currentBuildingHour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  
  // 2. Scan your static source operational metrics using the building's current hour
  const activeSlot = slots.find((slot) => currentBuildingHour >= slot.start && currentBuildingHour < slot.end);
  
  // Safety Fallback: Exit cleanly if opened outside operational columns (e.g., past 22:00 building time)
  if (!activeSlot) return null;

  // 3. Return the clean synchronized layout lookup key token string
  return getSlotKey(dayNum, monthIndex, year, activeSlot.start);
};

export const getSlotLabel = (interval: HouseholdSlot): string => {
    return `${interval.start} - ${interval.end}`;
};

export type SlotTimeState = 'past' | 'live' | 'future';

export interface AggregatedSlotInfo {
  id: string;
  status: SlotStatus;
  bookedBy: string | null;
  startTime: string | null;
  endTime: string | null;
  apartmentId: string | null;
  displaySubstring: string;
  notes?: string | null;
}

/**
 * Groups and indexes raw database arrays into mapped keys by translating UTC records into the building's timezone [google:4].
 */
export const getAggregatedBookingsMap = (
  bookings: Booking[], 
  apartments: Record<string, string>,
  currentApartmentId: string | null,
): Record<string, AggregatedSlotInfo> => {
  
  const finalMap: Record<string, AggregatedSlotInfo> = {};
  const grouped: Record<string, Booking[]> = {};
  const timezone = getHouseholdTimezone();
  
  bookings.forEach((b) => {
    const d = new Date(b.start_time);
    
    // 1. EXTRACT BUILDING DATETIME METRICS: Translates universal dates into local building variables [google:4]
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: timezone, 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
    const parts = formatter.formatToParts(d);
    
    const bYear = parseInt(parts.find(p => p.type === 'year')!.value, 10);
    const bMonth = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // Normalize to 0-indexed month
    const bDay = parseInt(parts.find(p => p.type === 'day')!.value, 10);
    const bHour = getBuildingHour(d); // Translates 15:00 UTC cleanly into 17 

    const key = getSlotKey(bDay, bMonth, bYear, bHour);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  // 2. Reduce the groups into aggregated display nodes
  Object.entries(grouped).forEach(([key, slotBookings]) => {
    // 1. PRIORITY CHECK: Look for an admin blockout first!
    const adminBooking = slotBookings.find((b) => b.status === 'admin');
    // 2. TENANT CHECK: Fallback to look for a standard active tenant booking
    const tenantBooking = slotBookings.find((b) => b.status === 'active');
    
    if (adminBooking) {
      
      // Check if the current user actually had a personal booking hidden underneath this admin block
      const userWasOverridden = tenantBooking && tenantBooking.apartment_id === currentApartmentId;

      finalMap[key] = {
        id: adminBooking.id, // Keep the admin booking ID so the admin can click and delete it
        status: userWasOverridden ? SlotStatus.OVERRIDDEN : SlotStatus.NOT_RESERVABLE,
        bookedBy: i18n.t('slotStatus.not_reservable'),
        startTime: adminBooking.start_time,
        endTime: adminBooking.end_time,
        apartmentId: adminBooking.apartment_id,
        displaySubstring: userWasOverridden 
          ? i18n.t('slotSubstring.not_reservable_override') 
          : i18n.t('slotSubstring.not_reservable_blocked'),
        notes: adminBooking.notes || null,
      };
      return;
    }
    if (tenantBooking) {
      const apartmentName = apartments[tenantBooking.apartment_id ?? ''];
      const booked_by_user = tenantBooking.apartment_id === currentApartmentId;
      
      finalMap[key] = {
        id: tenantBooking.id,
        status: booked_by_user ? SlotStatus.BOOKED_BY_USER : SlotStatus.BOOKED,
        bookedBy: apartmentName,
        startTime: tenantBooking.start_time,
        endTime: tenantBooking.end_time,
        apartmentId: tenantBooking.apartment_id,
        displaySubstring: booked_by_user 
          ? i18n.t('slotSubstring.booked_by_you') 
          : `${i18n.t('slotSubstring.booked_by')} ${apartmentName}.`,
        notes: tenantBooking.notes || null,
      };
      return;
    }

    const releasedBooking = slotBookings.find((b) => b.status === 'released');
    
    if (releasedBooking) {
      const name = apartments[releasedBooking.apartment_id ?? ''] || i18n.t('slotSubstring.another_apartment');
      finalMap[key] = {
        id: releasedBooking.id,
        status: SlotStatus.RELEASED,
        bookedBy: name,
        startTime: releasedBooking.start_time,
        endTime: releasedBooking.end_time,
        apartmentId: releasedBooking.apartment_id,
        displaySubstring: i18n.t('slotSubstring.released'),
      };
      return;
    }
  });

  return finalMap;
};

export const emptySlotFallback = (): AggregatedSlotInfo => ({
  id:'',
  status: SlotStatus.AVAILABLE,
  bookedBy: null,
  startTime: null,
  endTime: null,
  apartmentId: null,
  displaySubstring: i18n.t('slotSubstring.available'),
});

/**
 * Calculates time status by comparing pure absolute Unix epoch milliseconds [google:1].
 * Highly resilient against timezone shifting as it measures absolute elapsed time [google:1].
 */
export function getSlotTimeState(startTime: Date, endTime: Date): SlotTimeState {
  if (!startTime || !endTime) return 'past';

  const today = new Date();
  const nowTime = today.getTime();
  const startTimer = startTime.getTime();
  const endTimer = endTime.getTime();

  if (nowTime >= startTimer && nowTime < endTimer) {
    return 'live';
  }
  
  if (nowTime >= endTimer) {
    return 'past';
  }

  return 'future';
}

export interface ParsedSlotSelection {
  dateString: string;
  slot: HouseholdSlot;
  slotTimeState: SlotTimeState;
}

/**
 * Transforms a raw database record's start/end timestamps into 
 * localized calendar grid components matching the building clock .
 */
export function parseSlotRowToSelection(
  startTimeStr: string | null,
  endTimeStr: string | null,
  householdTimezone: string
): ParsedSlotSelection | null {
  if (!startTimeStr || !endTimeStr) return null;

  const startDate = new Date(startTimeStr);
  const endDate = new Date(endTimeStr);

  // Synchronize wall-clock outputs with the property's physical location 
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: householdTimezone,
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric', 
    hour: 'numeric', 
    hour12: false
  });
  
  const parts = formatter.formatToParts(startDate);
  const endParts = formatter.formatToParts(endDate);

  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const activeMonth = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // Normalize to 0-indexed month
  const dayNum = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  
  const startHour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const endHour = parseInt(endParts.find(p => p.type === 'hour')!.value, 10);

  return {
    dateString: getDateString(dayNum, activeMonth, year),
    slot: { id: '', start: startHour, end: endHour },
    slotTimeState: getSlotTimeState(startDate, endDate)
  };
}

/**
 * Checks if two timestamps are consecutive, skipping over unreservable night gaps.
 * Uses the building timezone to remain perfectly consistent with the rest of the application.
 */
function isConsecutiveSlot(
  endIsoString: string, 
  nextStartIsoString: string, 
  householdSlots: SlotsPolicy
): boolean {
  if (endIsoString === nextStartIsoString) return true;

  const endDate = new Date(endIsoString);
  const nextDate = new Date(nextStartIsoString);
  
  const timezone = getHouseholdTimezone();
  const openingHour = householdSlots.startHour; 
  const closingHour = householdSlots.endHour; 

  // Extract wall-clock hour matching the building's physical location
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });

  const endBuildingHour = parseInt(formatter.format(endDate), 10);

  // If the previous block finishes exactly at the facility closing hour
  if (endBuildingHour === closingHour) {
    // 1. Calculate when the next opening window should be in the building's timezone
    const expectedNextMorning = new Date(endDate.getTime());
    
    // Move 1 day forward safely using absolute milliseconds to keep the exact hour position
    expectedNextMorning.setTime(expectedNextMorning.getTime() + 24 * 60 * 60 * 1000);
    
    // 2. Validate if the next booking matches this expected next morning slot exactly
    const nextParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
    }).formatToParts(nextDate);

    const nextBuildingHour = parseInt(nextParts.find(p => p.type === 'hour')!.value, 10);
    
    // Compare dates components via simple strings to avoid local runtime engine discrepancies
    const expectedDateStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).format(expectedNextMorning);
    const nextDateStr = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' }).format(nextDate);

    return nextBuildingHour === openingHour && expectedDateStr === nextDateStr;
  }

  return false;
}

/**
 * Aggregates individual shifts into continuous blocks, bridging over night gaps.
 */
export function aggregateAdminMaintenanceBlocks(bookings: Booking[], householdSlots: SlotsPolicy): Booking[] {
  if (bookings.length === 0) return [];
  
  // Arrange chronologically by absolute timeline positions
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const aggregatedBlocks: Booking[] = [];
  // Deep copy properties to ensure zero shared side-effects down the road
  let currentBlock = JSON.parse(JSON.stringify(sorted[0]));

  for (let i = 1; i < sorted.length; i++) {
    const nextBooking = sorted[i];

    const currentEndTS = new Date(currentBlock.end_time).getTime();
    const nextStartTS = new Date(nextBooking.start_time).getTime();

    // Connect if there is a timestamp overlap or a valid building night operational gap
    if (nextStartTS <= currentEndTS || isConsecutiveSlot(currentBlock.end_time, nextBooking.start_time, householdSlots)) {
      const nextEndTS = new Date(nextBooking.end_time).getTime();
      if (nextEndTS > currentEndTS) {
        currentBlock.end_time = nextBooking.end_time;
      }
    } else {
      // Clean logical daytime gap discovered -> close and save preceding group
      aggregatedBlocks.push(currentBlock);
      currentBlock = JSON.parse(JSON.stringify(nextBooking));
    }
  }

  aggregatedBlocks.push(currentBlock);
  return aggregatedBlocks;
}
