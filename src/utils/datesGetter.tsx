export function getDaysInMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getFirstDayOfMonth(monthIndex: number, year: number) {
  return new Date(year, monthIndex, 1).getDay();
}

export function getDate(dayNum: number, monthIndex: number, year: number) {
  return new Date(year, monthIndex, dayNum).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

