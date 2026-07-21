import { useEffect, useMemo, useRef, useState } from 'react';
import { SLOTS } from '../constants/dates';
import MonthSwitcher from '../utils/MonthSwitcher';
import { getDate, getDateString, getDaysInMonth, getFirstDayOfMonth, getLocalizedDaysOfWeek } from '../utils/datesGetter';
import { cn } from '../utils/cn';
import { SlotStatus } from '../constants/SlotStatus';
import { AggregatedSlotInfo, emptySlotFallback, getAggregatedBookingsMap, getSlotKey, getSlotLabel, getSlotTimeState, SlotTimeState } from '../utils/slotsUtils';
import { useBookingFilters, useMonthBookings } from '../hooks/useBookings';
import { LoadingSpinner } from '../components/LoadingSpinner';
import BookingModal from '../bookingModals/BookingModal';
import { useApartments } from '../hooks/useApartments';
import { useTranslation } from 'react-i18next';
import PageLayout from '../components/PageLayout';
import { PageHeader } from '../components/PageHeader';
import { Calendar } from 'lucide-react';
import { ROUTES } from '../routes/routes.constants';
import { useHistory } from 'react-router-dom';

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
  const history = useHistory();
  const todayRowRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();
  const days = getLocalizedDaysOfWeek();

  const [selectedSlot, setSelectedSlot] = useState<{ dateString: string, slotTimes: number[], slotTimeState: SlotTimeState, nextSlotAvailable: boolean, nextSlotTimes: number[] | null } | null>(null);
  
  const [selectedBooking, setSelectedBooking] = useState<AggregatedSlotInfo>(emptySlotFallback);
  const { viewDate, setViewDate, householdId, apartmentId } = useBookingFilters();
  const { data: bookings = [], isLoading } = useMonthBookings(householdId, viewDate); 
  const { data: apartments = [] } = useApartments(householdId);
  
  const apartmentsMap = useMemo(() => {
    return Object.fromEntries(apartments.map((a) => [a.id, a.display_name]));
  }, [apartments]);

  const aggregatedBookingsMap = useMemo(() => {
    return getAggregatedBookingsMap(bookings, apartmentsMap, apartmentId);
  }, [bookings, apartmentsMap, apartmentId]);

  const handleOpenModal = (dayNum: number, slotTimes: number[], slotInfo: AggregatedSlotInfo, slotTimeState: SlotTimeState, nextSlotAvailable: boolean, nextSlotTimes: number[] | null ) => {
    setSelectedSlot({ dateString: getDateString(dayNum, activeMonth, year), slotTimes: slotTimes , slotTimeState:slotTimeState, nextSlotAvailable, nextSlotTimes });
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
    const isToday = isCurrentMonth && dayNum === today.getDay();
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

  const onBack = () => {
    history.push(ROUTES.APARTMENT_LOGIN);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <PageLayout 
      scrollable={false}
      header={
        <PageHeader 
          title={t('dashboard.calendar')} 
          icon={<Calendar className="w-7 h-7 text-blue-500" />} 
          onBack={onBack} 
        />
      }
    >
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, minHeight: 0 }}>
      {/* Month Switcher Header */}
      <div style={{ flexShrink: 0 }}>
        <MonthSwitcher activeMonth={activeMonth} setActiveMonth={handleSetMonth} />
      </div>

      {/* Grid Canvas Wrapper */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-800">        
        {/* Columns Description Title row */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 shrink-0">
          <div className={cn(dayColStyles, "text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-r border-gray-200 dark:border-slate-800")}>
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
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >          
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
                
                // compute availability for the next chronological slot only if the current slot is free 
                const nextSlotIndex = col + 1;
                const nextSlotConfig = SLOTS[nextSlotIndex]; // Verifies if a subsequent daily slot column configuration exists
                
                let isNextAvailable = false;
                let nextSlotTimesArray: number[] | null = null;

                // Calculate data availability targets only if not in Admin Mode and current slot is free
                if ( slotInfo.status === SlotStatus.AVAILABLE && nextSlotConfig) {
                  const nextSlotLookupKey = getSlotKey(dayNum, activeMonth, year, nextSlotConfig[0]);
                  const nextSlotInfo = aggregatedBookingsMap[nextSlotLookupKey] ?? emptySlotFallback();
                  
                  if (nextSlotInfo.status === SlotStatus.AVAILABLE) {
                    isNextAvailable = true;
                    nextSlotTimesArray = nextSlotConfig;
                  }
                }

                return (
                  <SlotCell 
                    key={col} 
                    slotStatus={slotInfo.status}
                    isCurrentTimeSlot={isCurrentTimeSlot}
                    onClick={() => handleOpenModal(dayNum, slot, slotInfo, slotTimeState, isNextAvailable, nextSlotTimesArray)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Actions Confirmation sheet layout [google:4] */}
      {selectedSlot && (
        <BookingModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          selectedSlot={selectedSlot}
          currentSlot={selectedBooking}
          nextSlotAvailable={selectedSlot.nextSlotAvailable}
          nextSlotTimes={selectedSlot.nextSlotTimes}
        />
      )}
    </div>
    </PageLayout>
  );
}
