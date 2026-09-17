import React, { createContext, useState } from 'react';
import { SlotsPolicy } from '../lib/databaseTypes';

interface BookingContextType {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  householdId: string;
  apartmentId: string;
  householdTimezone: string;
  isAdminMode: boolean;
  slotsPolicy: SlotsPolicy;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: React.ReactNode;
  householdId: string; 
  apartmentId: string;
  householdTimezone: string;
  isAdminMode: boolean;
  slotsPolicy: SlotsPolicy;
}


// BookingContext.tsx
export const BookingProvider: React.FC<BookingProviderProps> = ({ children, householdId, apartmentId, householdTimezone, isAdminMode, slotsPolicy }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  return (
    <BookingContext.Provider 
      value={{ 
        viewDate, 
        setViewDate, 
        householdId, 
        apartmentId, 
        householdTimezone, 
        isAdminMode,
        slotsPolicy
      }}>
      {children}
    </BookingContext.Provider>
  );
};
