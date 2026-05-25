import { SlotStatus } from '../constants/SlotStatus';
import { BUILDING_TIMEZONE } from '../constants/temporary';
import { Booking } from '../lib/databaseTypes';
import i18n from '../locales/i18n';
import { getBuildingHour } from './datesGetter';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format standard string dictionary mapping reference token: "2026-5-25-17"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};

export const getSlotLabel =  (interval: number[]): string => {
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
}

/**
 * Groups and indexes raw database arrays into mapped keys by translating UTC records into the building's timezone [google:4].
 */
export const getAggregatedBookingsMap = (
  bookings: Booking[], 
  apartments: Record<string, string>,
  currentApartmentId: string,
): Record<string, AggregatedSlotInfo> => {
  
  const grouped: Record<string, Booking[]> = {};
  
  bookings.forEach((b) => {
    const d = new Date(b.start_time);
    
    // 1. EXTRACT BUILDING DATETIME METRICS: Translates universal dates into local building variables [google:4]
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: BUILDING_TIMEZONE, 
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
  const finalMap: Record<string, AggregatedSlotInfo> = {};

  Object.entries(grouped).forEach(([key, slotBookings]) => {
    const activeBooking = slotBookings.find((b) => b.status === 'active');
    
    if (activeBooking) {
      const booked_by_user = activeBooking.apartment_id === currentApartmentId;
      const name = apartments[activeBooking.apartment_id ?? ''] || i18n.t('slotSubstring.another_apartment');
      finalMap[key] = {
        id: activeBooking.id,
        status: booked_by_user ? SlotStatus.BOOKED_BY_USER : SlotStatus.BOOKED,
        bookedBy: name,
        startTime: activeBooking.start_time,
        endTime: activeBooking.end_time,
        apartmentId: activeBooking.apartment_id,
        displaySubstring: booked_by_user 
            ? i18n.t('slotSubstring.booked_by_you') 
            : `${i18n.t('slotSubstring.booked_by')} ${name}.`,
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