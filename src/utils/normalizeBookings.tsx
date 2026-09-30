import { getHouseholdTimezone } from './getters';
import { Booking } from '../lib/databaseTypes';

export interface NormalizedBooking {
  id: string;
  apartment_id: string | null;
  dateStr: string;   // Building local day "YYYY-MM-DD"
  startHour: number; // Building local start hour
  endHour: number;   // Building local end hour
  notes: string | null;
  status:  "active" | "released" | "admin";
  released_at?: number; // Unix timestamp in millisecondi
  created_at: string | null;
  created_by: string | null;
}

/**
 * Transforms an array of raw database UTC bookings into clean, 
 * building-timezone normalized models to prevent frontend timezone drift.
 */
export function normalizeBookings(rawBookings: Booking[]): NormalizedBooking[] {
  if (!rawBookings || !Array.isArray(rawBookings)) return [];
  
  const timezone = getHouseholdTimezone();
  
  // Usiamo 'en-GB' e hourCycle: 'h23' per garantire che la mezzanotte sia 0 e le 23 rimangano 23
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', hourCycle: 'h23'
  });

  return rawBookings.map((booking) => {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);

    const startParts = formatter.formatToParts(start);
    const endParts = formatter.formatToParts(end);

    const year = startParts.find(p => p.type === 'year')!.value;
    const month = startParts.find(p => p.type === 'month')!.value;
    const day = startParts.find(p => p.type === 'day')!.value;
    
    // Ora restituiscono correttamente un numero da 0 a 23
    const startHour = parseInt(startParts.find(p => p.type === 'hour')!.value, 10);
    const endHour = parseInt(endParts.find(p => p.type === 'hour')!.value, 10);
    
    // Corretto: released_at si aspetta un timestamp numerico (number) se presente
    const releasedAtTimestamp = booking.released_at 
      ? new Date(booking.released_at).getTime() 
      : undefined;

    return {
      id: booking.id,
      apartment_id: booking.apartment_id,
      dateStr: `${year}-${month}-${day}`, // Data locale dell'edificio
      startHour,                          // Ora locale di inizio (0-23)
      endHour,                            // Ora locale di fine (0-23)
      notes: booking.notes,
      status: booking.status,
      released_at: releasedAtTimestamp,
      created_at: booking.created_at,
      created_by: booking.created_by,
    };
  });
}
