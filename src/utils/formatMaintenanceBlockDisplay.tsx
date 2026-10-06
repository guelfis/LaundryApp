
import i18n from '../locales/i18n';

interface FormattedMaintenanceBlock {
  title: string;
  subtitle: string;
}

/**
 * Transforms absolute maintenance ISO strings into clean, responsive card layouts.
 * Outputs readable structures like "Sep 29 – 30, 2026" or "Oct 8, 2026"
 */
export function formatMaintenanceBlockDisplay(startDate: string, startHour: number, endDate:string, endHour:number): FormattedMaintenanceBlock {
  if (!startDate || !endDate) {
    return { title: '', subtitle: '' };
  }

  // dates are in the format "year-month-day"
  const startDateArray = startDate.split('-');
  const endDateArray = endDate.split('-');
  const startYear = startDateArray[0]; // "2026"
  const endYear = endDateArray[0];     // "2026"
  const startDay = parseInt(startDateArray[2], 10);
  const endDay = parseInt(endDateArray[2], 10);

  // Safely get the short month name ("Sep", "Oct") using neutral UTC date strings
  const startDateObj = new Date(`${startDate}T00:00:00Z`);
  const endDateObj = new Date(`${endDate}T00:00:00Z`);
  const locale = i18n.language || 'en-US';
  const startMonthStr = startDateObj.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' });
  const endMonthStr = endDateObj.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' });

  const isMultiDay = startDate !== endDate;

  // 3. Dynamic Title Generation
  let title = `${startMonthStr} ${startDay}, ${startYear}`; // Single day default: "Oct 8, 2026"
  
  if (isMultiDay) {
    if (startYear !== endYear) {
      // Cross-year: "Dec 30, 2026 – Jan 2, 2027"
      title = `${startMonthStr} ${startDay}, ${startYear} – ${endMonthStr} ${endDay}, ${endYear}`;
    } else if (startMonthStr !== endMonthStr) {
      // Cross-month: "Sep 30 – Oct 1, 2026"
      title = `${startMonthStr} ${startDay} – ${endMonthStr} ${endDay}, ${startYear}`;
    } else {
      // Standard multi-day same month: "Sep 29 – 30, 2026"
      title = `${startMonthStr} ${startDay} – ${endDay}, ${startYear}`;
    }
  }

  // 4. Dynamic Subtitle Generation
  const subtitle = isMultiDay 
    ? `${startHour} on ${startMonthStr} ${startDay} — ${endHour} on ${endMonthStr} ${endDay}`
    : `${startHour} - ${endHour}`;

  return { title, subtitle };
}
