import React, { createContext, useState } from 'react';

interface BookingContextType {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  householdId: string;
  apartmentId: string;
  householdTimezone: string;
  isAdminMode: boolean;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: React.ReactNode;
  householdId: string; 
  apartmentId: string;
  householdTimezone: string;
  isAdminMode: boolean;
}


// BookingContext.tsx
export const BookingProvider: React.FC<BookingProviderProps> = ({ children, householdId, apartmentId, householdTimezone, isAdminMode }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  return (
    <BookingContext.Provider 
      value={{ 
        viewDate, 
        setViewDate, 
        householdId, 
        apartmentId, 
        householdTimezone, 
        isAdminMode 
      }}>
      {children}
    </BookingContext.Provider>
  );
};
