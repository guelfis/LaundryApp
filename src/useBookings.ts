import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookingsByHousehold, releaseLaundrySlot, bookLaundrySlot } from './lib/bookings';
import { useContext } from 'react';
import { BookingContext } from './contexts/BookingContext';

// hook to access the BookingContext
export const useBookingFilters = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBookingFilters must be used within a BookingProvider");
  }
  return context;
};

// hook for the monthly bookings query
export const useMonthBookings = (householdId: string, viewDate: Date) => {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString();
  const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

  return useQuery({
    // when the householdId or viewDate changes, React Query will automatically refetch the data
    queryKey: ['bookings', householdId, firstDay], 
    queryFn: () => getBookingsByHousehold(householdId, firstDay, lastDay),
  });
};

interface BookSlotParams {
  apartmentId: string;
  dateStr: string;   // Format 'YYYY-MM-DD'
  startHour: number; // es. 7, 12, 17
  endHour: number;   // es. 12, 17, 22
}

export function useBookingActions() {
  const queryClient = useQueryClient();

  // mutation: books the remaining time of the slot or an entire one. 
  const bookSlotMutation = useMutation({
    mutationFn: async ({ apartmentId, dateStr, startHour, endHour }: BookSlotParams) => bookLaundrySlot(apartmentId, dateStr, startHour, endHour),
    onSuccess: () => {
      // forces the refresh of the calendar to show the new slots
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
    }
  });

  // mutation, releases a slot if ongoing, deletes it if in the future
  const releaseSlotMutation = useMutation({
    mutationFn: async (bookingId: string) => releaseLaundrySlot(bookingId),
    onSuccess: () => {
      // updated the calendar to not show the released slot
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
    }
  });

  return {
    bookSlot: bookSlotMutation.mutateAsync,
    isBooking: bookSlotMutation.isPending,
    releaseSlot: releaseSlotMutation.mutateAsync,
    isReleasing: releaseSlotMutation.isPending
  };
}
