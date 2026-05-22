import i18n from '../locales/i18n'; // Import to read current app language

export function getDaysInMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getFirstDayOfMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex, 1).getDay();
}

export function getDate(dayNum: number, monthIndex: number, year: number, hour:number) {
  return new Date(year, monthIndex, dayNum, hour, 0, 0);
}

export function getDateString(dayNum: number, monthIndex: number, year: number) {
  return new Date(year, monthIndex, dayNum).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Generates localized month names: ['January', 'February', ...] or ['Enero', 'Febrero', ...]
export const getLocalizedMonths = (): string[] => {
  const locale = i18n.language || 'en';
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  
  return Array.from({ length: 12 }, (_, i) => 
    formatter.format(new Date(2026, i, 1))
  );
};

// Generates localized short weekdays: ['Sun', 'Mon', ...] or ['Dom', 'Lun', ...]
export const getLocalizedDaysOfWeek = (): string[] => {
  const locale = i18n.language || 'en';
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  
  // Base date index 4 is a Sunday (Jan 4, 2026) to ensure order stability
  return Array.from({ length: 7 }, (_, i) => 
    formatter.format(new Date(2026, 0, 4 + i))
  );
};
