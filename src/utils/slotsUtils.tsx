import { SlotStatus } from '../constants/SlotStatus';
import { Booking } from '../lib/databaseTypes';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format: "2026-05-06-7"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};

export interface AggregatedSlotInfo {
  status: SlotStatus;
  bookedBy: string | null;
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
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
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
        status: booked_by_user ? SlotStatus.BOOKED_BY_USER : SlotStatus.BOOKED,
        bookedBy: name,
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
        status: SlotStatus.RELEASED,
        bookedBy: name,
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
  status: SlotStatus.AVAILABLE,
  bookedBy: null,
  endTime: null,
  apartmentId: null,
  displaySubstring: 'is available for booking.',
});
