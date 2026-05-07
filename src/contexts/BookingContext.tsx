import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBookingsByHousehold } from '../lib/bookings'; 
import { Booking } from '../lib/database.types';


interface BookingContextType {
  bookings: Booking[];
  viewDate: Date;
  setViewDate: (date: Date) => void;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: React.ReactNode;
  householdId: string; 
}

  
export const BookingProvider: React.FC<BookingProviderProps> = ({ children, householdId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewDate, setViewDate] = useState(new Date()); // the month we want to view

  const refreshBookings = async () => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString();
    const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const data = await getBookingsByHousehold(householdId, firstDay, lastDay);
    setBookings(data || []);
  };

  // reload when householdId or viewDate changes
  useEffect(() => {
    refreshBookings();
  }, [householdId, viewDate]);

  return (
    <BookingContext.Provider value={{ bookings, setViewDate, viewDate, refreshBookings }}>
      {children}
    </BookingContext.Provider>
  );
};

// personalized hook
export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBookings deve essere usato dentro un BookingProvider");
  return context;
};
