import { useEffect, useMemo, useRef, useState } from 'react';
import { SLOTS } from '../constants/dates';
import MonthSwitcher from '../utils/MonthSwitcher';
import { getDate, getDateString, getDaysInMonth, getFirstDayOfMonth, getLocalizedDaysOfWeek } from '../utils/datesGetter';
import { cn } from '../utils/cn';
import { SlotStatus } from '../constants/SlotStatus';
import { AggregatedSlotInfo, emptySlotFallback, getAggregatedBookingsMap, getSlotKey, getSlotLabel, getSlotTimeState, SlotTimeState } from '../utils/slotsUtils';
import { useBookingFilters, useMonthBookings } from '../hooks/useBookings';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SlotModal from '../utils/SlotModal';
import { useApartments } from '../hooks/useApartments';
import { getCleanStorageItem } from '../auth/authUtils';
import { useTranslation } from 'react-i18next';

const dayColStyles = "w-24 shrink-0 px-4 py-3";

function DayCell({ dayName, dayNum, isToday, dayOfWeekIndex }: { dayName: string; dayNum: number; isToday: boolean, dayOfWeekIndex: number }) {
  const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6; 
  return (
    <div className={cn(dayColStyles, "border-r border-gray-200 flex items-center gap-1", isWeekend ? "bg-gray-100" : "bg-white" )}>
      <span className={`text-sm ${isToday ? 'font-bold text-blue-700' : 'font-medium text-gray-700'}`}>
        {dayName}
      </span>
      <span className={`text-sm ${isToday ? 'font-bold text-blue-700' : 'text-gray-400'}`}>
        {dayNum}
      </span>
    </div>
  );
}

interface SlotCellProps {
  onClick: () => void;
  slotStatus: SlotStatus;
  isCurrentTimeSlot: boolean; 
}

function SlotCell({ onClick, slotStatus, isCurrentTimeSlot }: SlotCellProps) {
  const isBooked = slotStatus === SlotStatus.BOOKED;
  const isYours = slotStatus === SlotStatus.BOOKED_BY_USER;
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 min-h-[48px] border-r border-gray-100 last:border-r-0 transition-all m-[1px] outline-none",
        "active:bg-gray-100/70",
        
        // 1. Clean Pastel Background Colors
        isYours 
          ? "bg-blue-100/80 text-blue-800 font-medium" 
          : isBooked 
            ? "bg-red-100/80 text-red-800"              
            : "bg-transparent",
            
        // 2. The Indicator Frame: ONLY active on the current live time slot
        isCurrentTimeSlot 
          ? "border border-blue-400/60 rounded-lg shadow-sm" 
          : "border border-transparent"
      )}
    />       
  );
}

export default function CalendarGridTab() {
  const todayRowRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();
  const days = getLocalizedDaysOfWeek();

  const [selectedSlot, setSelectedSlot] = useState<{ dateString: string, slotTimes: number[], slotTimeState: SlotTimeState } | null>(null);
  const apartmentId = useMemo(() => getCleanStorageItem('apartmentId') || '', []);
  
  const [selectedBooking, setSelectedBooking] = useState<AggregatedSlotInfo>(emptySlotFallback);
  const { viewDate, setViewDate, householdId } = useBookingFilters();
  const { data: bookings = [], isLoading } = useMonthBookings(householdId, viewDate); 
  const { data: apartments = [] } = useApartments(householdId);
  
  const apartmentsMap = useMemo(() => {
    return Object.fromEntries(apartments.map((a) => [a.id, a.display_name]));
  }, [apartments]);

  const aggregatedBookingsMap = useMemo(() => {
    return getAggregatedBookingsMap(bookings, apartmentsMap, apartmentId);
  }, [bookings, apartmentsMap, apartmentId]);

  const handleOpenModal = (dayNum: number, slotTimes: number[], slotInfo: AggregatedSlotInfo, slotTimeState: SlotTimeState) => {
    setSelectedSlot({ dateString: getDateString(dayNum, activeMonth, year), slotTimes: slotTimes , slotTimeState:slotTimeState});
    setSelectedBooking(slotInfo);
  };

  const activeMonth = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const daysInMonth = getDaysInMonth(activeMonth, year);
  const firstDay = getFirstDayOfMonth(activeMonth, year);

  const today = new Date();
  const isCurrentMonth = activeMonth === today.getMonth() && year === today.getFullYear();

  const rows = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayName = days[(firstDay + i) % 7];
    const dayOfWeekIndex = (firstDay + i) % 7; 
    const isToday = isCurrentMonth && dayNum === today.getDate();
    return { dayNum, dayName, isToday, dayOfWeekIndex };
  });

  useEffect(() => {
    if (todayRowRef.current) {
      todayRowRef.current.scrollIntoView({
        behavior: 'smooth', 
        block: 'start',    
      });
    }
  }, [activeMonth]); 

  const handleSetMonth = (month: number) => {
    const newDate = new Date(year, month, 1, 0, 0, 0);
    setViewDate(newDate);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      {/* Month Switcher Header */}
      <div style={{ flexShrink: 0 }}>
        <MonthSwitcher activeMonth={activeMonth} setActiveMonth={handleSetMonth} />
      </div>

      {/* Grid Canvas Wrapper */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        
        {/* Columns Description Title row */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          <div className={cn(dayColStyles, "text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200")}>
            {t('calendarGrid.day')}
          </div>
          {SLOTS.map((slot) => {
            const label = getSlotLabel(slot);
            return (
              <div key={label} className="flex-1 min-w-fit whitespace-nowrap px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center border-r border-gray-200 last:border-r-0">
                {label}
              </div>
            );
          })}
        </div>

        {/* Scrollable Rows Matrix Box */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden WebkitOverflowScrolling-touch">
          {rows.map(({ dayNum, dayName, isToday, dayOfWeekIndex }, idx) => (
            <div
              key={dayNum}
              ref={isToday ? todayRowRef : null}
              id={isToday ? 'today-calendar-row' : undefined}
              className={cn(
                'flex border-b last:border-b-0 transition-colors',
                isToday
                  ? 'bg-blue-50/40 border-blue-200 border-2'
                  : idx % 2 !== 0 ? 'bg-gray-50/50' : 'bg-white'
              )}
            >
              <DayCell dayName={dayName} dayNum={dayNum} isToday={isToday} dayOfWeekIndex={dayOfWeekIndex} />
              
              {SLOTS.map((slot, col) => {
                const slotKey = getSlotKey(dayNum, activeMonth, year, slot[0]);
                const slotInfo = aggregatedBookingsMap[slotKey] ?? emptySlotFallback();
                const startTime = getDate(dayNum, activeMonth, year, slot[0]);
                const endTime = getDate(dayNum, activeMonth, year, slot[1]);
                const slotTimeState = getSlotTimeState(startTime, endTime);
                const isCurrentTimeSlot = slotTimeState === 'live';

                return (
                  <SlotCell 
                    key={col} 
                    slotStatus={slotInfo.status}
                    isCurrentTimeSlot={isCurrentTimeSlot}
                    onClick={() => handleOpenModal(dayNum, slot, slotInfo, slotTimeState)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Actions Confirmation sheet layout [google:4] */}
      {selectedSlot && (
        <SlotModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          selectedSlot={selectedSlot}
          currentSlot={selectedBooking}
        />
      )}
    </div>
  );
}
