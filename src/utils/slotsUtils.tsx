import { SlotStatus } from '../constants/SlotStatus';
import { Booking } from '../lib/database.types';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Formato: "2026-05-06-7"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};


export const getBookingStatus = (bookings: Booking[]) => {
    if (bookings.length === 0) return SlotStatus.AVAILABLE;
    
    // 1. Se c'è almeno una prenotazione 'active', lo slot è ufficialmente occupato
    const hasActive = bookings.some(b => b.status === 'active');
    if (hasActive) return SlotStatus.BOOKED;

    // 2. Se non ci sono 'active' ma c'è una 'released', lo slot è libero per subentro
    const hasReleased = bookings.some(b => b.status === 'released');
    if (hasReleased) return SlotStatus.RELEASED; // Assicurati di avere questo stato nell'enum

    // 3. Fallback (es. tutte cancellate)
    return SlotStatus.AVAILABLE;
}
