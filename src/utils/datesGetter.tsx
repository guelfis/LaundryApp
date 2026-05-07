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
  }); // Restituisce "6 May 2026"
}

export const getSlotKey = (day: number, month: number, year: number, slotTime: string) => {
  // Formato: "2026-05-06-09-12"
  return `${year}-${month + 1}-${day}-${slotTime.replace(/\s/g, '')}`;
};