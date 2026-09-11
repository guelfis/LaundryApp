import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SectionText from "../baseComponents/SectionText";
import { useApartmentMembers, useApartments, usePendingRequests } from "../hooks/useApartments";
import { useUpcomingBookings, useBookings, useBookingFilters } from "../hooks/useBookings";
import { resolveCurrentUserId, checkIsAdminApartment } from "../auth/authUtils";
import { Calendar, LayoutDashboard } from "lucide-react"; 
import { LoadingSpinner } from "../baseComponents/LoadingSpinner";
import { SLOTS } from "../constants/dates";
import { AggregatedSlotInfo, emptySlotFallback, getAggregatedBookingsMap, getCurrentSlotKey, getSlotKey, parseSlotRowToSelection, SlotTimeState } from "../utils/slotsUtils";
import { SlotStatus } from "../constants/SlotStatus";
import DashboardSlotCard from "../components/DashboardSlotCard";
import { getBuildingCurrentDateTime, getDate, getDateStringFromDate, getTimeSlotString } from "../utils/datesGetter"; 
import { TravelingBanner } from "../components/TravelingBanner";
import SlotCard from "../baseComponents/SlotCard";
import PageLayout from "../baseComponents/PageLayout";
import { PageHeader } from "../baseComponents/PageHeader";
import { ROUTES } from "../routes/routes.constants";
import { useHistory } from "react-router-dom";
import BookingModal from "../bookingModals/BookingModal";
import Button from "../baseComponents/Button";
import AdminBookingModal from "../bookingModals/AdminBookingModal";

export default function UserDashboard() {
  const { householdId, householdTimezone, apartmentId, isAdminMode } = useBookingFilters();
  const { t } = useTranslation();
  const history = useHistory();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Shared React calendar grid hooks variables
  const [selectedSlot, setSelectedSlot] = useState<{ 
    dateString: string, 
    slotTimes: number[], 
    slotTimeState: SlotTimeState,
    nextSlotAvailable: boolean,
    nextSlotTimes: number[] | null
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AggregatedSlotInfo>(emptySlotFallback());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  useEffect(() => {
    resolveCurrentUserId().then((id) => setCurrentUserId(id));
  }, []);

  // Traveling banner validation trigger check
  const travelingStatus = useMemo(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; 
    return {
      isTraveling: userTimezone !== householdTimezone,
      userTimezone
    };
  }, [householdTimezone]);

  // Sync calendar date metrics range boundaries
  const queryRange = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const morning = getDate(currentDay, currentMonth, currentYear, 6);
    const evening = getDate(currentDay, currentMonth, currentYear, 23);

    return { morning, evening };
  }, []);

  const { data: members = [] } = useApartmentMembers(apartmentId, { enabled: !!apartmentId && !isAdminMode });
  const { data: requests = [] } = usePendingRequests(apartmentId, { enabled: !!apartmentId && !isAdminMode });
  const { data: bookings = [] } = useBookings(householdId, queryRange.morning, queryRange.evening);
  const { data: apartments = [] } = useApartments(householdId);
  const { data: upcomingBookings = [], isLoading } = useUpcomingBookings(apartmentId);

  const isUserAdmin = useMemo(() => checkIsAdminApartment(members, currentUserId), [members, currentUserId]);

  const apartmentsMap = useMemo(() => {
    return Object.fromEntries(apartments.map((a) => [a.id, a.display_name]));
  }, [apartments]);

  const aggregatedBookingsMap = useMemo(() => {
    return getAggregatedBookingsMap(bookings, apartmentsMap, apartmentId);
  }, [bookings, apartmentsMap, apartmentId]);

  const upcomingAggregated = useMemo(() => {
    return getAggregatedBookingsMap(upcomingBookings, apartmentsMap, apartmentId);
  }, [upcomingBookings, apartmentsMap, apartmentId]);


  const ongoingState = useMemo(() => {
    const currentSlotKey = getCurrentSlotKey(SLOTS);

    if (!currentSlotKey) {
      return { bookingId: null, slotStatus: SlotStatus.AFTER_HOURS, slotKey: null, nextSlotAvailable: false, nextSlotConfig: null };
    }
    
    const activeBooking = aggregatedBookingsMap[currentSlotKey] ?? emptySlotFallback();
    
    const bClock = getBuildingCurrentDateTime(householdTimezone);

    // 2. Identify the active slot array item index 
    const currentSlotIndex = SLOTS.findIndex(([start, end]) => bClock.hour >= start && bClock.hour < end);
    const nextSlotConfig = SLOTS[currentSlotIndex + 1] || null;
    let isNextAvailable = false;

    // 3. Evaluate the subsequent consecutive slot properties
    if (!isAdminMode && activeBooking.status === SlotStatus.AVAILABLE && nextSlotConfig) {
      const nextSlotKey = getSlotKey(bClock.day, bClock.monthIndex, bClock.year, nextSlotConfig[0]);
      const nextSlotInfo = aggregatedBookingsMap[nextSlotKey] ?? emptySlotFallback();
      
      if (nextSlotInfo.status === SlotStatus.AVAILABLE) {
        isNextAvailable = true;
      }
    }
    
    
    return {
      bookingId: activeBooking.id,
      slotStatus: activeBooking.status,
      slotKey: currentSlotKey,
      nextSlotAvailable: isNextAvailable,
      nextSlotConfig
    };
  }, [aggregatedBookingsMap, isAdminMode, householdTimezone]);

  const handleOpenModal = (slotInfo: AggregatedSlotInfo, nextAvailable = false, nextTimes: number[] | null = null) => {
    const parsedSelection = parseSlotRowToSelection(
      slotInfo.startTime, 
      slotInfo.endTime, 
      householdTimezone
    );

    if (parsedSelection) {
      setSelectedSlot({
        ...parsedSelection,
        nextSlotAvailable: nextAvailable,
        nextSlotTimes: nextTimes
      });
      setSelectedBooking(slotInfo);
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageLayout 
      header={
        <PageHeader 
            title="Dashboard"
            icon={<LayoutDashboard className="w-7 h-7 text-blue-500" />} 
            onBack={() => history.push(ROUTES.APARTMENT_LOGIN)} 
        />
      }
    >
      <div className="w-full px-4 py-2 flex flex-col gap-6 flex-1 overflow-y-auto">
        
        {/* 1. TRAVELING ALERT BANNER SYSTEM */}
        {travelingStatus.isTraveling && (
          <TravelingBanner userTz={travelingStatus.userTimezone} buildingTz={householdTimezone} />
        )}

        {/* 2. NOTIFICATION BANNER (ADMIN ONLY) */}
        {isUserAdmin && requests.length > 0 && (
          <div className="w-full p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl flex items-center gap-3 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <div className="text-sm font-medium text-amber-800 dark:text-amber-400">
              {t("userDashboard.pending_requests_count", { count: requests.length })}
            </div>
          </div>
        )}

        {/* 3. ONGOING STATUS PANEL */}
        <div className="flex flex-col gap-2">
          <SectionText title={t("userDashboard.live_status")} />
          <DashboardSlotCard 
            state={ongoingState.slotStatus}
            onClick={() => {
              const bookingInfo = aggregatedBookingsMap[ongoingState.slotKey ?? ""] ?? emptySlotFallback();
              
              // If the live slot is completely free, generate fallback parameters cleanly
              if (ongoingState.slotStatus === SlotStatus.AVAILABLE && ongoingState.slotKey) {
                
                // 1. REUSE THE UNIFIED WALL-CLOCK HELPER 
                const bClock = getBuildingCurrentDateTime(householdTimezone);
                const currentSlotConfig = SLOTS.find(([start, end]) => bClock.hour >= start && bClock.hour < end);
                
                if (currentSlotConfig) {
                  // 2. Generate pristine date boundaries without parsing discrepancies 
                  const fallbackStart = new Date(bClock.year, bClock.monthIndex, bClock.day, currentSlotConfig[0]);
                  const fallbackEnd = new Date(bClock.year, bClock.monthIndex, bClock.day, currentSlotConfig[1]);
                  
                  bookingInfo.startTime = fallbackStart.toISOString();
                  bookingInfo.endTime = fallbackEnd.toISOString();
                }
              }
              // Open the modal with verified parameters and consecutive slot flags
              handleOpenModal(bookingInfo, ongoingState.nextSlotAvailable, ongoingState.nextSlotConfig);
            }}
          />
        </div>

        {/* ADMIN BLOCK */}
        
        {isAdminMode && (
          <div className="flex flex-col gap-2">
            <SectionText title={t("userDashboard.admin_action")} />
            <p className="text-xs text-gray-400 pl-1 mt-1">{t("userDashboard.block_laundry")}</p>
            <Button 
              onClick={() => setIsAdminModalOpen(true)}
              variant="primary"
              icon="shieldAlert"
              label={t('userDashboard.btn_admin_block')}
            />
          </div>
        )}
      

        {/* 4. UPCOMING RESERVATIONS LIST */}
        <div className="flex flex-col gap-2">
          <SectionText title={t("userDashboard.next_reservations")} />
          {upcomingBookings.length > 0 ? (
            <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 rounded-2xl divide-y divide-gray-100 dark:divide-slate-800/50 overflow-hidden shadow-sm">
              {Object.values(upcomingAggregated).map((slotInfo) => {
                const dateObj = new Date(slotInfo.startTime ?? "");
                const localizedDate = getDateStringFromDate(dateObj);
                const timeRangeString = getTimeSlotString(
                  dateObj,
                  new Date(slotInfo.endTime ?? "")
                );

                return (
                  <SlotCard 
                    key={slotInfo.id}
                    icon={<Calendar className="w-5 h-5 text-blue-500" />}
                    iconBgClass="bg-blue-50 dark:bg-blue-950/20"
                    title={localizedDate}
                    subtitle={timeRangeString}
                    onClick={() => handleOpenModal(slotInfo, false, null)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 pl-1 mt-1">{t("userDashboard.no_bookings")}</p>
          )}
        </div>

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
        {isAdminModalOpen && (
          <AdminBookingModal
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
            bookings={upcomingBookings}
          />
        )}

      </div>
  </PageLayout>
);

}
