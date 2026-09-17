import { LoadingSpinner } from '../baseComponents/LoadingSpinner';
import { SlotStatus } from '../constants/SlotStatus';
import { cn } from '../utils/cn';
import { useApartments } from '../hooks/useApartments';
import { AggregatedSlotInfo, emptySlotFallback, getAggregatedBookingsMap, getSlotKey, getSlotLabel, getSlotTimeState, SlotTimeState } from '../utils/slotsUtils';
import { generateMonthRows } from '../utils/calendarUtils';
import { useBookingFilters, useMonthBookings } from '../hooks/useBookings';
import { useEffect, useMemo, useRef, useState } from 'react';
import BookingModal from '../bookingModals/BookingModal';
import { getDate, getDateString, getLocalizedDaysOfWeek } from '../utils/datesGetter';
import { useTranslation } from 'react-i18next';
import { useIonViewDidEnter } from '@ionic/react';
import { HouseholdSlot } from '../lib/databaseTypes';

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
  const isAdminBlocked = slotStatus === SlotStatus.NOT_RESERVABLE;
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
          : isAdminBlocked
            ? "bg-gray-200/80 text-gray-600 font-medium"
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

interface CalendarGridProps {
  activeMonth: number;
  viewDate: Date; 
}

export default function CalendarGrid({ activeMonth, viewDate }: CalendarGridProps) {
  const { t } = useTranslation();
  const days = getLocalizedDaysOfWeek();
  const todayRowRef = useRef<HTMLDivElement | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ dateString: string, slot: HouseholdSlot, slotTimeState: SlotTimeState, nextSlotAvailable: boolean, nextSlot: HouseholdSlot | null } | null>(null);
  
  const [selectedBooking, setSelectedBooking] = useState<AggregatedSlotInfo>(emptySlotFallback);

  const { householdId, apartmentId, slotsPolicy } = useBookingFilters();
  const activeYear = viewDate.getFullYear();
  const { data: bookings = [], isLoading } = useMonthBookings(householdId, viewDate); 
  const { data: apartments = [] } = useApartments(householdId);
    
  const apartmentsMap = useMemo(() => {
    return Object.fromEntries(apartments.map((a) => [a.id, a.display_name]));
  }, [apartments]);

  const aggregatedBookingsMap = useMemo(() => {
    return getAggregatedBookingsMap(bookings, apartmentsMap, apartmentId);
  }, [bookings, apartmentsMap, apartmentId]);

  const rows = generateMonthRows(days, viewDate);

  // Scroll to the "today" row when the component mounts and when the month changes
  useIonViewDidEnter(() => {
    if (!isLoading && todayRowRef.current) {
      todayRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });

  // Keep a separate, tiny effect ONLY to handle layout scrolling when the month changes
  useEffect(() => {
    if (!isLoading && todayRowRef.current) {
      todayRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [activeMonth, isLoading]);

  const handleOpenModal = (dayNum: number, slot: HouseholdSlot, slotInfo: AggregatedSlotInfo, slotTimeState: SlotTimeState, nextSlotAvailable: boolean, nextSlot: HouseholdSlot | null ) => {
    setSelectedSlot({ dateString: getDateString(dayNum, activeMonth, activeYear), slot , slotTimeState:slotTimeState, nextSlotAvailable, nextSlot });
    setSelectedBooking(slotInfo);
  };

    return (
    <div className="flex-1 min-h-0 flex flex-col w-full">
      {/* Grid Canvas Wrapper */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-800">        
        {/* Columns Description Title row */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 shrink-0">
          <div className={cn(dayColStyles, "text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-r border-gray-200 dark:border-slate-800")}>
            {t('calendarGrid.day')}
          </div>
          {slotsPolicy.slots.map((slot) => {
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
            display: isLoading ? 'flex' : 'block',
            alignItems: isLoading ? 'center' : 'initial',
            justifyContent: isLoading ? 'center' : 'initial',
          }}
        >  
          {isLoading ? ( 
              <LoadingSpinner />
          ) : (
            rows.map(({ dayNum, dayName, isToday, dayOfWeekIndex }, idx) => (
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
                
                {slotsPolicy.slots.map((slot, col) => {
                  const slotKey = getSlotKey(dayNum, activeMonth, activeYear, slot.start);
                  const slotInfo = aggregatedBookingsMap[slotKey] ?? emptySlotFallback();
                  const startTime = getDate(dayNum, activeMonth, activeYear, slot.start);
                  const endTime = getDate(dayNum, activeMonth, activeYear, slot.end);
                  const slotTimeState = getSlotTimeState(startTime, endTime);
                  const isCurrentTimeSlot = slotTimeState === 'live';
                  
                  // compute availability for the next chronological slot only if the current slot is free 
                  const nextSlotIndex = col + 1;
                  const nextSlotConfig = slotsPolicy.slots[nextSlotIndex]; // Verifies if a subsequent daily slot column configuration exists
                  
                  let isNextAvailable = false;

                  // Calculate data availability targets only if not in Admin Mode and current slot is free
                  if (slotInfo.status === SlotStatus.AVAILABLE && nextSlotConfig) {
                    const nextSlotLookupKey = getSlotKey(dayNum, activeMonth, activeYear, nextSlotConfig.start);
                    const nextSlotInfo = aggregatedBookingsMap[nextSlotLookupKey] ?? emptySlotFallback();
                    
                    if (nextSlotInfo.status === SlotStatus.AVAILABLE) {
                      isNextAvailable = true;
                    }
                  }

                  return (
                    <SlotCell 
                      key={col} 
                      slotStatus={slotInfo.status}
                      isCurrentTimeSlot={isCurrentTimeSlot}
                      onClick={() => handleOpenModal(dayNum, slot, slotInfo, slotTimeState, isNextAvailable, nextSlotConfig)}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Overlay Modal Injection View */}
      {selectedSlot && (
        <BookingModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          selectedSlot={selectedSlot}
          currentSlot={selectedBooking}
          nextSlotAvailable={selectedSlot.nextSlotAvailable}
          nextSlot={selectedSlot.nextSlot}
        />
      )}
    </div>
  );
}