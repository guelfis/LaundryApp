import i18n from '../locales/i18n'; 
import { getHouseholdTimezone } from './getters';
 
/**
 * Extracts the exact numeric hour of a date object interpreted within the building's localized timezone.
 */
export const getBuildingHour = (date: Date): number => {
  const timezone = getHouseholdTimezone();
  return parseInt(
    date.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }), 
    10
  );
};

export function getDaysInMonth(monthIndex: number, year: number) {
  // Using day 0 of the next month extracts the last day of the target month natively
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function getFirstDayOfMonth(monthIndex: number, year: number) {
  // Returns the weekday index (0 = Sunday, 6 = Saturday) using explicit UTC boundaries
  return new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
}

/**
 * Generates a JavaScript Date object synchronized with the building's clock .
 * This calculates the precise universal millisecond timestamp representing when hour "X" happens at the building .
 */
export function getDate(dayNum: number, monthIndex: number, year: number, hour: number ): Date {
  // 1. Create a baseline date using the smartphone's local execution clock
  const baseDate = new Date(year, monthIndex, dayNum, hour, 0, 0);
  const timezone = getHouseholdTimezone();
  
  // 2. Compute the exact difference in milliseconds between the smartphone's location and the building's location
  const tzBuilding = baseDate.toLocaleString('en-US', { timeZone: timezone }); 
  const tzLocal = baseDate.toLocaleString('en-US');
  
  const diffInMilliseconds = Date.parse(tzLocal) - Date.parse(tzBuilding);
  
  // 3. Return the absolute timestamp shifted cleanly by the timezone discrepancy gap 
  return new Date(baseDate.getTime() + diffInMilliseconds);
}

/**
 * Formats the calendar row title string by looking at the date AT THE BUILDING.
 * This stops date roll-overs (e.g., a late 23:00 building slot showing up as the next day due to UTC compression) .
 */
export function getDateString(dayNum: number, monthIndex: number, year: number, ): string {
  // Create a safe reference point at noon to prevent any daytime edge leaks
  const baseDate = new Date(year, monthIndex, dayNum, 12, 0, 0);
  const locale = i18n.language || 'en-GB';
  const timezone = getHouseholdTimezone();
  return baseDate.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone
  });
}

export function getDateStringFromDate(date: Date ): string {
  const locale = i18n.language || 'en-GB';
  const timezone = getHouseholdTimezone();

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone
  });
}

export const getTimeSlotString = (startHour: Date, endHour: Date): string => {
    const timezone = getHouseholdTimezone();
    const formatBuildingHour = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        timeZone: timezone, 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: false 
      });
    };
    return `${formatBuildingHour(startHour)} - ${formatBuildingHour(endHour)}`;
};

// Generates localized month names dynamically without data mutations
export const getLocalizedMonths = (): string[] => {
  const locale = i18n.language || 'en';
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
  
  return Array.from({ length: 12 }, (_, i) => 
    formatter.format(new Date(Date.UTC(2026, i, 1)))
  );
};

// Generates localized short weekdays dynamically with high stability
export const getLocalizedDaysOfWeek = (): string[] => {
  const locale = i18n.language || 'en';
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  
  // Base date index 4 is a Sunday (Jan 4, 2026 UTC) to ensure weekday order stability
  return Array.from({ length: 7 }, (_, i) => 
    formatter.format(new Date(Date.UTC(2026, 0, 4 + i)))
  );
};

/**
 * Returns the current date and hour components synchronized 
 * to the building's physical timezone wall-clock .
 */
export function getBuildingCurrentDateTime(timezone: string) {
  const today = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
  });
  
  const parts = formatter.formatToParts(today);
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const monthIndex = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);

  return { year, monthIndex, day, hour };
}