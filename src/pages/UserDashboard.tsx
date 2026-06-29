import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SectionText from "../components/SectionText";
import { useApartmentMembers, useApartments, usePendingRequests } from "../hooks/useApartments";
import { useUpcomingBookings, useBookings, useBookingFilters } from "../hooks/useBookings";
import { resolveCurrentUserId, checkIsAdminApartment } from "../auth/authUtils";
import { Calendar, LayoutDashboard } from "lucide-react"; 
import { LoadingSpinner } from "../components/LoadingSpinner";
import { SLOTS } from "../constants/dates";
import { AggregatedSlotInfo, emptySlotFallback, getAggregatedBookingsMap, getCurrentSlotKey, getSlotTimeState, SlotTimeState } from "../utils/slotsUtils";
import { SlotStatus } from "../constants/SlotStatus";
import DashboardSlotCard from "../components/DashboardSlotCard";
import { getDate, getDateString, getDateStringFromDate, getTimeSlotString } from "../utils/datesGetter"; 
import { TravelingBanner } from "../components/TravelingBanner";
import SlotCard from "../components/SlotCard";
import SlotModal from "../utils/SlotModal";
import PageLayout from "../components/PageLayout";
import { PageHeader } from "../components/PageHeader";
import { ROUTES } from "../routes/routes.constants";
import { useHistory } from "react-router-dom";

export default function UserDashboard() {
  const { householdId, householdTimezone, apartmentId } = useBookingFilters();
  const { t } = useTranslation();
  const history = useHistory();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Shared React calendar grid hooks variables
  const [selectedSlot, setSelectedSlot] = useState<{ dateString: string, slotTimes: number[], slotTimeState: SlotTimeState } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AggregatedSlotInfo>(emptySlotFallback());

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

  const { data: members = [] } = useApartmentMembers(apartmentId);
  const { data: requests = [] } = usePendingRequests(apartmentId);
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
      return { bookingId: null, slotStatus: SlotStatus.NOT_RESERVABLE, slotKey: null };
    }
    
    const activeBooking = aggregatedBookingsMap[currentSlotKey];
    if (!activeBooking) {
      return { bookingId: null, slotStatus: SlotStatus.AVAILABLE, slotKey: currentSlotKey };
    }
    
    return {
      bookingId: activeBooking.id,
      slotStatus: activeBooking.status,
      slotKey: currentSlotKey,
    };
  }, [aggregatedBookingsMap]);

  const handleOpenModal = (slotInfo: AggregatedSlotInfo) => {

    const startDate = new Date(slotInfo.startTime ?? "");
    const endDate = new Date(slotInfo.endTime ?? "");

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: householdTimezone,
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
    });
    
    const parts = formatter.formatToParts(startDate);
    const endParts = formatter.formatToParts(endDate);

    const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
    const activeMonth = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // Riporta a 0-indexed
    const dayNum = parseInt(parts.find(p => p.type === 'day')!.value, 10);
    
    const startHour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
    const endHour = parseInt(endParts.find(p => p.type === 'hour')!.value, 10);
    const slotTimes = [startHour, endHour];
    const slotTimeState = getSlotTimeState(startDate, endDate);

    setSelectedSlot({ 
        dateString: getDateString(dayNum, activeMonth, year), 
        slotTimes, 
        slotTimeState 
    });
    
    setSelectedBooking(slotInfo);
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
              if (ongoingState.bookingId) {
                const bookingInfo = aggregatedBookingsMap[ongoingState.slotKey ?? ""] ?? emptySlotFallback();
                handleOpenModal(bookingInfo);
              }
            }}
          />
        </div>

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
                    onClick={() => handleOpenModal(slotInfo)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 pl-1 mt-1">{t("userDashboard.no_bookings")}</p>
          )}
        </div>

        {selectedSlot && (
          <SlotModal
            isOpen={!!selectedSlot}
            onClose={() => setSelectedSlot(null)}
            selectedSlot={selectedSlot}
            currentSlot={selectedBooking}
          />
        )}

      </div>
  </PageLayout>
);

}
