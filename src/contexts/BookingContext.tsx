import React, { createContext, useState } from 'react';

interface BookingContextType {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  householdId: string;
  apartmentId: string;
  householdTimezone: string;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: React.ReactNode;
  householdId: string; 
  apartmentId: string;
  householdTimezone: string;
}


// BookingContext.tsx
export const BookingProvider: React.FC<BookingProviderProps> = ({ children, householdId, apartmentId, householdTimezone }) => {
  const [viewDate, setViewDate] = useState(new Date());

  return (
    <BookingContext.Provider value={{ viewDate, setViewDate, householdId, apartmentId, householdTimezone }}>
      {children}
    </BookingContext.Provider>
  );
};
