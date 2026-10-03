
interface FormattedMaintenanceBlock {
  title: string;
  subtitle: string;
}

/**
 * Transforms absolute maintenance ISO strings into clean, responsive card layouts.
 * Outputs readable structures like "Sep 29 – 30, 2026"
 */
export function formatMaintenanceBlockDisplay(startDate: string, startHour: number, endDate:string, endHour:number): FormattedMaintenanceBlock {

  // dates are in the format "year-month-day"
  // 2. Core calendar tokens
  
  const startDateArray = startDate.split('-');
  const endDateArray = endDate.split('-');
  const startYear = startDateArray[0]; // "2026"
  const endYear = endDateArray[0];   // "2026"
  const startDay = startDateArray.slice(-1);
  const endDay = endDateArray.slice(-1);

  // 2. Safely get the short month name ("Sep") using a neutral UTC date string
  // Adding "T00:00:00Z" guarantees JavaScript parses it exactly as written without timezone shifts
  const startDateObj = new Date(`${startDate}T00:00:00Z`)
  const startMonthStr = startDateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const endMonthStr = new Date(`${endDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });

  const isMultiDay = startDay !== endDay || startMonthStr !== endMonthStr || startYear !== endYear;

  // 3. Dynamic Title Generation
  let title = startDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); // Single day default
  
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
