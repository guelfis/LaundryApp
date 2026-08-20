import { getDaysInMonth, getFirstDayOfMonth } from '../utils/datesGetter';

export function generateMonthRows(days: string[], viewDate: Date){
  const activeMonth = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = getDaysInMonth(activeMonth, year);
  const firstDay = getFirstDayOfMonth(activeMonth, year);

  const today = new Date();
  const isCurrentMonth = activeMonth === today.getMonth() && year === today.getFullYear();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayName = days[(firstDay + i) % 7];
    const dayOfWeekIndex = (firstDay + i) % 7; 
    const isToday = isCurrentMonth && dayNum === today.getDate();
    return { dayNum, dayName, isToday, dayOfWeekIndex };
  });
}