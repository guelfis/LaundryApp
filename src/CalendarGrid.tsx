import { useMemo } from 'react';
import { DAYS_OF_WEEK, SLOTS } from './constants/dates';
import MonthSwitcher from './MonthSwitcher';
import { getDate, getDaysInMonth, getFirstDayOfMonth } from './utils/datesGetter';
import { cn } from './utils/cn';
import { SlotStatus } from './constants/SlotStatus';
import { getBookingsMap, getBookingStatus, getSlotKey } from './utils/slotsUtils';
import { useBookingFilters, useMonthBookings } from './useBookings';
import { LoadingSpinner } from './components/LoadingSpinner';
import PageLayout from './components/PageLayout';


const dayColStyles = "w-24 shrink-0 px-4 py-3";


function DayCell({ dayName, dayNum, isToday }: { dayName: string; dayNum: number; isToday: boolean }) {
  const isWeekend = dayName === 'Sat' || dayName === 'Sun'; 
  return (
            <div className={cn( dayColStyles , "border-r border-gray-200 flex items-center gap-1", isWeekend ? "bg-gray-100" : "bg-white" )}>
                <span className={`text-sm ${isToday ? 'font-bold text-blue-700' : 'font-medium text-gray-700'}`}>
                  {dayName}
                </span>
                <span className={`text-sm ${isToday ? 'font-bold text-blue-700' : 'text-gray-400'}`}>
                  {dayNum}
                </span>
            </div>
    )
}

function SlotCell(
  { onClick, slotStatus }: { onClick: () => void; slotStatus: SlotStatus }) {
    const isBooked = slotStatus === SlotStatus.BOOKED;
    // todo add check on who booked it to show different colors and avoid booking over someone else's slot
    return (
    <button 
      onClick={onClick}
      // active:bg-blue-200 provides "tap" feedback on mobile
      className={cn(
        "flex-1 border-r border-gray-100 last:border-r-0 min-h-[48px]", // 48px is the mobile touch-target standard
        "active:bg-blue-100 transition-colors",
        isBooked ? "bg-red-50" : "bg-transparent"
      )}
    />       
  )
}

function CalendarGrid(
  { onSlotClick }: { onSlotClick: (dayNum: string, slot: string, slotKey: string) => void }
) {
      const { viewDate, setViewDate, householdId } = useBookingFilters();
      const { data: bookings = [], isLoading } = useMonthBookings(householdId, viewDate); 
      
      
      // Create a map for quick lookup of bookings by slotKey only when bookings change
      const bookingsMap = useMemo(() => {
        return getBookingsMap(bookings);
      }, [bookings]);

      if (isLoading) return <PageLayout><LoadingSpinner /></PageLayout>;
    
      const activeMonth = viewDate.getMonth();
      const year = viewDate.getFullYear();
      const daysInMonth = getDaysInMonth(activeMonth, year);
      const firstDay = getFirstDayOfMonth(activeMonth, year);
    
      const today = new Date();
      const isCurrentMonth = activeMonth === today.getMonth() && year === today.getFullYear();
    
      const rows = Array.from({ length: daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dayName = DAYS_OF_WEEK[(firstDay + i) % 7];
        const isToday = isCurrentMonth && dayNum === today.getDate();
        return { dayNum, dayName, isToday };
      });

      const handleSetMonth = (month: number) => {
        const newDate = new Date(year, month, 1);
          setViewDate(newDate);
      };

      
      return (
        // Main Container: flex column to stack month switcher and grid, height to fill viewport minus some space for header
    <div style={{display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0  }}>
      
        {/* Month Switcher: stays in place */}
      <div style={{ flexShrink: 0 }}>
        <MonthSwitcher activeMonth={activeMonth} setActiveMonth={handleSetMonth} />
      </div>

      {/* Grid Container: flex-1 makes it fill the remaining space */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        
        {/* Grid Header */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          <div className={cn(dayColStyles, "text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200")}>
            Day
          </div>
          {SLOTS.map((slot) => (
            <div key={slot.label} className="flex-1 min-w-fit whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 last:border-r-0">
              {slot.label}
            </div>
          ))}
        </div>

        {/* Grid Body: Scrollable area for the grid cells */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden WebkitOverflowScrolling-touch">
          {rows.map(({ dayNum, dayName, isToday }, idx) => (
            <div
              key={dayNum}
              className={cn(
                'flex border-b last:border-b-0 transition-colors',
                isToday
                  ? 'bg-blue-50 border-blue-200 border-2'
                  : idx % 2 !== 0 ? 'bg-gray-50/50' : 'bg-white'
              )}
            >
              <DayCell dayName={dayName} dayNum={dayNum} isToday={isToday} />
              {SLOTS.map((slot, col) => {
                const slotKey = getSlotKey(dayNum, activeMonth, year, slot.startHour);
                const slotBookings = bookingsMap[slotKey] || [];
                return (
                  <SlotCell 
                    key={col} 
                    onClick={() => onSlotClick(getDate(dayNum, activeMonth, year), slot.label, slotKey)} 
                    slotStatus={getBookingStatus(slotBookings)} 
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
);

}

export default CalendarGrid;