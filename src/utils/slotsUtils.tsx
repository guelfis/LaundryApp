import { SlotStatus } from '../constants/SlotStatus';
import { Booking } from '../lib/database.types';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format: "2026-05-06-7"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};


export const getBookingStatus = (bookings: Booking[]) => {
    if (bookings.length === 0) return SlotStatus.AVAILABLE;
    
    // 1. If there's at least one 'active' booking, the slot is booked
    const hasActive = bookings.some(b => b.status === 'active');
    if (hasActive) return SlotStatus.BOOKED;

    // 2. If there are no 'active' but there is a 'released', the slot is available for rebooking
    const hasReleased = bookings.some(b => b.status === 'released');
    if (hasReleased) return SlotStatus.RELEASED; 

    // 3. Fallback to available if there are bookings but none are active or released (shouldn't happen in normal flow)
    return SlotStatus.AVAILABLE;
}


export const getBookingsMap = (bookings: Booking[]) => {
    const map: Record<string, Booking[]> = {};

    bookings.forEach((b) => {
    const d = new Date(b.start_time);
    const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}-${d.getHours()}`;
    
    if (!map[key]) {
        map[key] = [];
    }
    map[key].push(b);
    });

    return map;
}