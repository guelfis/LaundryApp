import { SlotStatus } from '../constants/SlotStatus';
import { HouseholdSlot, SlotsPolicy } from '../lib/databaseTypes';
import i18n from '../locales/i18n';
import { addDaysToDateString } from './adminModalUtils';
import { getBuildingCurrentDateTime } from './datesGetter';
import { getHouseholdTimezone } from './getters';
import { NormalizedBooking } from './normalizeBookings';

export const getSlotKey = (day: number, month: number, year: number, slotStartHour: number) => {
  // Format standard string dictionary mapping reference token: "2026-5-25-17"
  return `${year}-${month + 1}-${day}-${slotStartHour}`;
};

/**
 * Resolves the dynamic localized unique slotKey identifier for the current moment based on the building's clock.
 * Returns null if the current hour falls outside of operational boundaries (e.g., at night).
 */
export const getCurrentSlotKey = (slots: HouseholdSlot[]): string | null => {
  const today = new Date();
  const timezone = getHouseholdTimezone();
  
  // Convert the current live device moment into the exact numerical values matching the building's physical clock
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
  });
  
  const parts = formatter.formatToParts(today);
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const monthIndex = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // Reverts to 0-indexed format
  const dayNum = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  const currentBuildingHour = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  
  const activeSlot = slots.find((slot) => currentBuildingHour >= slot.start && currentBuildingHour < slot.end);
  if (!activeSlot) return null;

  return getSlotKey(dayNum, monthIndex, year, activeSlot.start);
};

export const getSlotLabel = (interval: HouseholdSlot): string => {
    return `${interval.start} - ${interval.end}`;
};

export type SlotTimeState = 'past' | 'live' | 'future';

export interface AggregatedSlotInfo {
  id: string;
  status: SlotStatus;
  bookedBy: string | null;
  dateStr: string;   // Building local day "YYYY-MM-DD"
  startHour: number; // Building local start hour
  endHour: number;
  apartmentId: string | null;
  displaySubstring: string;
  notes?: string | null;
}

/**
 * Groups and indexes raw database arrays into mapped keys by translating UTC records into the building's timezone.
 */
export const getAggregatedBookingsMap = (
  bookings: NormalizedBooking[], // Strictly typed to receive your normalized interfaces
  apartments: Record<string, string>,
  currentApartmentId: string | null,
): Record<string, AggregatedSlotInfo> => {
  
  const finalMap: Record<string, AggregatedSlotInfo> = {};
  const grouped: Record<string, NormalizedBooking[]> = {};
  
  bookings.forEach((b) => {
    if (!b.startHour) return;

    // Fast parsing since format is guaranteed to be YYYY-MM-DDTHH:mm:ss
    const [yearStr, monthStr, dayStr] = b.dateStr.split('-');
    
    const bYear = parseInt(yearStr, 10);
    const bMonth = parseInt(monthStr, 10) - 1; // Normalize to 0-indexed month for compatibility with getSlotKey
    const bDay = parseInt(dayStr, 10);
    
    const key = getSlotKey(bDay, bMonth, bYear, b.startHour);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  // Reduce the groups into aggregated display nodes
  Object.entries(grouped).forEach(([key, slotBookings]) => {
    const adminBooking = slotBookings.find((b) => b.status === 'admin');
    const tenantBooking = slotBookings.find((b) => b.status === 'active');
    
    if (adminBooking) {
      const userWasOverridden = tenantBooking && tenantBooking.apartment_id === currentApartmentId;

      finalMap[key] = {
        id: adminBooking.id,
        status: userWasOverridden ? SlotStatus.OVERRIDDEN : SlotStatus.NOT_RESERVABLE,
        bookedBy: i18n.t('slotStatus.not_reservable'),
        dateStr: adminBooking.dateStr,
        startHour: adminBooking.startHour,
        endHour: adminBooking.endHour,
        apartmentId: adminBooking.apartment_id,
        displaySubstring: userWasOverridden 
          ? i18n.t('slotSubstring.not_reservable_override') 
          : i18n.t('slotSubstring.not_reservable_blocked'),
        notes: adminBooking.notes || null,
      };
      return;
    }

    if (tenantBooking) {
      const apartmentName = apartments[tenantBooking.apartment_id ?? ''];
      const booked_by_user = tenantBooking.apartment_id === currentApartmentId;
      
      finalMap[key] = {
        id: tenantBooking.id,
        status: booked_by_user ? SlotStatus.BOOKED_BY_USER : SlotStatus.BOOKED,
        bookedBy: apartmentName,
        dateStr: tenantBooking.dateStr,
        startHour: tenantBooking.startHour,
        endHour: tenantBooking.endHour,
        apartmentId: tenantBooking.apartment_id,
        displaySubstring: booked_by_user 
          ? i18n.t('slotSubstring.booked_by_you') 
          : `${i18n.t('slotSubstring.booked_by')} ${apartmentName}.`,
        notes: tenantBooking.notes || null,
      };
      return;
    }

    const releasedBooking = slotBookings.find((b) => b.status === 'released');
    if (releasedBooking) {
      const name = apartments[releasedBooking.apartment_id ?? ''] || i18n.t('slotSubstring.another_apartment');
      finalMap[key] = {
        id: releasedBooking.id,
        status: SlotStatus.RELEASED,
        bookedBy: name,
        dateStr: releasedBooking.dateStr,
        startHour: releasedBooking.startHour,
        endHour: releasedBooking.endHour,
        apartmentId: releasedBooking.apartment_id,
        displaySubstring: i18n.t('slotSubstring.released'),
      };
      return;
    }
  });

  return finalMap;
};
export const emptySlotFallback = (date?:string, start?:number, end?:number): AggregatedSlotInfo => ({
  id:'',
  status: SlotStatus.AVAILABLE,
  bookedBy: null,
  dateStr: date ? date : "",
  startHour: start ? start : 0,
  endHour: end ? end :0,
  apartmentId: null,
  displaySubstring: i18n.t('slotSubstring.available'),
});

/**
 * Calculates time status by comparing pure absolute Unix epoch milliseconds.
 * Highly resilient against timezone shifting as it measures absolute elapsed time.
 */
export function getSlotTimeState(dateStr: string, startHour: number, endHour: number): SlotTimeState {
  if (dateStr == "") return 'past';
 

  const timezone = getHouseholdTimezone();
  const { year, monthIndex, day, hour } = getBuildingCurrentDateTime(timezone);
  
  const currentMonthStr = String(monthIndex + 1).padStart(2, '0');
  const currentDayStr = String(day).padStart(2, '0');
  const currentBuildingDateStr = `${year}-${currentMonthStr}-${currentDayStr}`;

  if (dateStr < currentBuildingDateStr) {
    return 'past';
  }

  if (dateStr > currentBuildingDateStr) {
    return 'future';
  }

  if (hour >= startHour && hour < endHour) {
    return 'live';
  }
  
  if (hour < startHour) {
    return 'future'; 
  }

  return 'past';
}

/**
 * Checks if two timestamps are consecutive, skipping over unreservable night gaps.
 * Uses the building timezone to remain perfectly consistent with the rest of the application.
 */
function isConsecutiveSlot(
  currentDate: string,
  currentEndHour: number,
  nextDate: string,
  nextStartHour:number,
  householdSlots: SlotsPolicy
): boolean {
  if (currentDate == nextDate && currentEndHour == nextStartHour) return true;

  const openingHour = householdSlots.startHour; 
  const closingHour = householdSlots.endHour; 

  // Se il blocco precedente finisce esattamente all'ora di chiusura della struttura...
  if (currentEndHour === closingHour) {
    // Calcoliamo il giorno successivo usando la stringa pura per evitare cambi d'ora/fuso
    const expectedNextMorningDateStr = addDaysToDateString(currentDate, 1);
    
    // È consecutivo se il blocco successivo inizia il mattino dopo all'orario di apertura
    return nextStartHour === openingHour && nextDate === expectedNextMorningDateStr;
  }

  return false;
}

export interface AggregatedBookings {
  apartment_id: string | null;
  startDate: string;
  startHour: number;
  endDate: string;
  endHour: number;
  id: string;
  bookings_ids: string[];
  notes: string | null;
}

/**
 * Aggregates individual shifts into continuous blocks, bridging over night gaps.
 */
export function aggregateAdminMaintenanceBlocks(bookings: NormalizedBooking[], householdSlots: SlotsPolicy): AggregatedBookings[] {
  if (bookings.length === 0) return [];
  
  // bookings are expected to be pre-sorted by start_time in ascending order by the query
  const aggregatedBlocks: AggregatedBookings[] = [];
  
  let currentBlock: AggregatedBookings = {
    apartment_id: bookings[0].apartment_id,
    startDate: bookings[0].dateStr,
    startHour: bookings[0].startHour,
    endDate: bookings[0].dateStr,
    endHour: bookings[0].endHour,
    id: bookings[0].id,
    bookings_ids: [bookings[0].id],
    notes: bookings[0].notes || "", // Initialize as string to easily append safely
  };

  for (let i = 1; i < bookings.length; i++) {
    const nextBooking = bookings[i];

    const isSameDay = currentBlock.endDate === nextBooking.dateStr;

    // Removed the strict isSameDay restriction from the outer condition 
    // to allow isConsecutiveSlot to bridge across night/day gaps if needed
    const isOverlappingOrAdjacent = 
      (isSameDay && nextBooking.startHour <= currentBlock.endHour) || 
      isConsecutiveSlot(currentBlock.endDate, currentBlock.endHour, nextBooking.dateStr, nextBooking.startHour, householdSlots);

    if (isOverlappingOrAdjacent) {
      // Update the boundary values
      currentBlock.endDate = nextBooking.dateStr;
      // Make sure we take the latest end hour if they overlap non-sequentially
      currentBlock.endHour = Math.max(currentBlock.endHour, nextBooking.endHour);
      currentBlock.bookings_ids.push(nextBooking.id);
      
      if (nextBooking.notes) {
        currentBlock.notes = currentBlock.notes 
          ? `${currentBlock.notes}\n${nextBooking.notes}` 
          : nextBooking.notes;
      }
    } else {
      // Commit the finished block
      aggregatedBlocks.push(currentBlock);
      
      // Initialize the next block
      currentBlock = {
        apartment_id: nextBooking.apartment_id,
        startDate: nextBooking.dateStr,
        startHour: nextBooking.startHour,
        endDate: nextBooking.dateStr,
        endHour: nextBooking.endHour,
        id: nextBooking.id,
        bookings_ids: [nextBooking.id],
        notes: nextBooking.notes || "",
      };
    }
  }

  // Always push the trailing active block after loop completion
  aggregatedBlocks.push(currentBlock);
  
  return aggregatedBlocks;
}
