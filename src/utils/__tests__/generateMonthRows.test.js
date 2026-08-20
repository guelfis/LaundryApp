import { generateMonthRows } from '../calendarUtils';
import { vi } from 'vitest';

describe('generateMonthRows', () => {
  // Reference array for weekdays
  const mockDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  test('correctly generates rows for a specific mock month', () => {
    // Setup: May 2026 (Month index 4 in JS). It has 31 days and starts on a Friday (index 5)
    const viewDate = new Date(2026, 4, 1);

    const rows = generateMonthRows(mockDays, viewDate);

    // Assertions
    expect(rows).toHaveLength(31);
    
    // First day of the month should be May 1st, Friday
    expect(rows[0]).toEqual({
      dayNum: 1,
      dayName: 'Fri',
      dayOfWeekIndex: 5,
      isToday: false,
    });

    // Saturday should be index 6
    expect(rows[1].dayOfWeekIndex).toBe(6);
    expect(rows[1].dayName).toBe('Sat');

    // Sunday should wrap around to index 0 due to the % 7 logic
    expect(rows[2].dayOfWeekIndex).toBe(0);
    expect(rows[2].dayName).toBe('Sun');
  });

  test('correctly flags the current day with isToday', () => {
    // Freeze the system time to a specific date for testing (August 15, 2026)
    const mockToday = new Date(2026, 7, 15);
    vi.useFakeTimers().setSystemTime(mockToday);

    const viewDate = new Date(2026, 7, 1); // August 2026
    const mockGetDaysInMonth = () => 31;
    const mockGetFirstDayOfMonth = () => 6; // August 2026 starts on a Saturday

    const rows = generateMonthRows(mockDays, viewDate);

    // Day 15 should have isToday set to true
    expect(rows[14].dayNum).toBe(15);
    expect(rows[14].isToday).toBe(true);

    // Other days should have isToday set to false
    expect(rows[0].isToday).toBe(false);

    // Restore real system time
    vi.useRealTimers();
  });
});
