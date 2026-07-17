import { SlotStatus } from '../constants/SlotStatus';
import { Booking } from '../lib/databaseTypes';
import i18n from '../locales/i18n';
import { getBuildingHour } from './datesGetter';
import { getHouseholdTimezone } from './getters';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format standard string dictionary mapping reference token: "2026-5-25-17"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};

/**
 * Resolves the dynamic localized unique slotKey identifier for the current moment based on the building's clock.
 * Returns null if the current hour falls outside of operational boundaries (e.g., at night).
 */
export const getCurrentSlotKey = (slots: number[][]): string | null => {
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
  const activeSlot = slots.find(([start, end]) => currentBuildingHour >= start && currentBuildingHour < end);
  
  // Safety Fallback: Exit cleanly if opened outside operational columns (e.g., past 22:00 building time)
  if (!activeSlot) return null;

  // 3. Return the clean synchronized layout lookup key token string
  return getSlotKey(dayNum, monthIndex, year, activeSlot[0]);
};

export const getSlotLabel = (interval: number[]): string => {
    return `${interval[0]} - ${interval[1]}`;
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
    const bHour = getBuildingHour(d); // Translates 15:00 UTC cleanly into 17 [google:4]

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
        status: SlotStatus.NOT_RESERVABLE,
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