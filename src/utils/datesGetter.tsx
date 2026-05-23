import i18n from '../locales/i18n'; // Import to read current app language

export function getDaysInMonth(monthIndex: number, year: number) {
  // Using day 0 of the next month extracts the last day of the target month natively
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function getFirstDayOfMonth(monthIndex: number, year: number) {
  // Returns the weekday index (0 = Sunday, 6 = Saturday) using explicit UTC boundaries
  return new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
}

export function getDate(dayNum: number, monthIndex: number, year: number, hour: number) {
  // Forced pure UTC creation sequence to align with database queries perfectly
  return new Date(Date.UTC(year, monthIndex, dayNum, hour, 0, 0));
}

export function getDateString(dayNum: number, monthIndex: number, year: number) {
  const utcDate = new Date(Date.UTC(year, monthIndex, dayNum));
  const locale = i18n.language || 'en-GB';

  // Explicitly passing 'UTC' to the timeZone parameter forces Intl to format the raw date,
  // bypassing the device's default smartphone timezone offset shift entirely.
  return utcDate.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

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
