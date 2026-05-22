import { SlotStatus } from '../constants/SlotStatus';
import { Booking } from '../lib/databaseTypes';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format: "2026-05-06-7"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};

export const getSlotLabel =  (interval: number[]): string => {
    return `${interval[0]} - ${interval[1]}`;
}

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

export const getAggregatedBookingsMap = (
  bookings: Booking[], 
  apartments: Record<string, string>,
  currentApartmentId: string,
): Record<string, AggregatedSlotInfo> => {
  
  // 1. Group raw bookings by their hourly date string keys
  const grouped: Record<string, Booking[]> = {};
  
  bookings.forEach((b) => {
    const d = new Date(b.start_time);
    const key = getSlotKey(d.getDate(),d.getMonth(),d.getFullYear(), d.getHours() )
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  // 2. Reduce those grouped arrays into your final unified slot states
  const finalMap: Record<string, AggregatedSlotInfo> = {};

  Object.entries(grouped).forEach(([key, slotBookings]) => {
    const activeBooking = slotBookings.find((b) => b.status === 'active');
    
    if (activeBooking) {

      const booked_by_user = activeBooking.apartment_id === currentApartmentId;
      const name = apartments[activeBooking.apartment_id ?? ''] || 'Another Apartment';
      finalMap[key] = {
        id: activeBooking.id,
        status: booked_by_user ? SlotStatus.BOOKED_BY_USER : SlotStatus.BOOKED,
        bookedBy: name,
        startTime: activeBooking.start_time,
        endTime: activeBooking.end_time,
        apartmentId: activeBooking.apartment_id,
        displaySubstring: booked_by_user 
            ? 'is booked by your apartment.' 
            : `is already booked by ${name}.`,
      };
      return;
    }

    const releasedBooking = slotBookings.find((b) => b.status === 'released');
    if (releasedBooking) {
      const name = apartments[releasedBooking.apartment_id ?? ''] || 'Another Apartment';
      finalMap[key] = {
        id: releasedBooking.id,
        status: SlotStatus.RELEASED,
        bookedBy: name,
        startTime: releasedBooking.start_time,
        endTime: releasedBooking.end_time,
        apartmentId: releasedBooking.apartment_id,
        displaySubstring: 'has been released! It can be booked again for the remaining time before the next slot starts.',
      };
      return;
    }
  });

  return finalMap;
};

// Fallback constant helper to return empty slot states safely without breaking renders
export const emptySlotFallback = (): AggregatedSlotInfo => ({
  id:'',
  status: SlotStatus.AVAILABLE,
  bookedBy: null,
  startTime: null,
  endTime: null,
  apartmentId: null,
  displaySubstring: 'is available for booking.',
});


export function getSlotTimeState(startTime: Date, endTime: Date): SlotTimeState {
  if (!startTime || !endTime) return 'past';

  const today = new Date();
  
  // Create comparable timestamps (stripping milliseconds/seconds for accuracy if needed)
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