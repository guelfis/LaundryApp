import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookingsByHousehold, releaseLaundrySlot, bookLaundrySlot, getUpcomingBookings, getUpcomingAdminBookings } from '../lib/bookings';
import { useContext } from 'react';
import { BookingContext } from '../contexts/BookingContext';
import { normalizeBookings } from '../utils/normalizeBookings';

export interface Slot {
  startHour: number;
  endHour: number;
}

interface BookSlotParams {
  apartmentId: string;
  dateStr: string;   // Format 'YYYY-MM-DD'
  slotHours: Slot[]; // Array of slot objects with startHour and endHour
  isAdminBlock: boolean; // Flag to indicate if the booking is an admin block
}


// hook to access the BookingContext
export const useBookingFilters = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBookingFilters must be used within a BookingProvider");
  }
  return context;
};

export const useMonthBookings = (householdId: string, viewDate: Date) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const paddedMonth = String(month + 1).padStart(2, '0');
  const nextPaddedMonth = String(month + 2).padStart(2, '0');
  
  const firstDay = `${year}-${paddedMonth}-01T00:00:00`;
  const lastDay = month === 11 
    ? `${year + 1}-01-01T00:00:00` 
    : `${year}-${nextPaddedMonth}-01T00:00:00`;

  return useQuery({
    queryKey: ['bookings', householdId, year, month], 
    queryFn: () => getBookingsByHousehold(householdId, firstDay, lastDay),
    enabled: !!householdId,
    select: normalizeBookings,
  });
};

export const useBookings = (householdId: string, startDate: Date, endDate: Date) => {
  const startDateString = startDate.toISOString();
  const endDateString = endDate.toISOString();

  return useQuery({
    queryKey: ['bookings', householdId, startDateString], 
    queryFn: () => getBookingsByHousehold(householdId, startDateString, endDateString),
    enabled: !!householdId,
    select: normalizeBookings,
  });
};


export function useBookingActions() {
  const queryClient = useQueryClient();

  const bookSlotMutation = useMutation({
    mutationFn: async ({ apartmentId, dateStr, slotHours, isAdminBlock }: BookSlotParams) => {  
      
      // Map over the parallel arrays index-by-index directly.
      // Index 0 triggers: bookLaundrySlot(id, date, 7, 9)
      // Index 1 triggers: bookLaundrySlot(id, date, 10, 12)
      const promises = slotHours.map((slot) => {
        return bookLaundrySlot(apartmentId, dateStr, slot.startHour, slot.endHour, isAdminBlock);
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['next-available-slots'] });
    }
  });

  const releaseSlotMutation = useMutation({
    mutationFn: async (bookingId: string) => releaseLaundrySlot(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['next-available-slots'] });
    }
  });

  return {
    bookSlot: bookSlotMutation.mutateAsync,
    isBooking: bookSlotMutation.isPending,
    releaseSlot: releaseSlotMutation.mutateAsync,
    isReleasing: releaseSlotMutation.isPending
  };
}


export function useUpcomingBookings(apartmentId: string , options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['upcoming-bookings', apartmentId],
    queryFn: () => getUpcomingBookings(apartmentId!),
    enabled: options?.enabled ?? !!apartmentId,
    select: normalizeBookings,
  });
}


export function useUpcomingAdminBookings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['upcoming-admin-bookings'],
    queryFn: () => getUpcomingAdminBookings(),
    enabled: options?.enabled ?? true,
    select: normalizeBookings,
  });
}