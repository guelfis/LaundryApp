import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookingsByHousehold, createBooking } from './lib/bookings';
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

// Hook for the mutation to add a booking
export const useAddBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      // Invalidate and refetch bookings after a new booking is added
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

