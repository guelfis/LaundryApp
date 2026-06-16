import React, { createContext, useEffect, useState } from 'react';

interface BookingContextType {
  viewDate: Date;
  setViewDate: (date: Date) => void;
  householdId: string;
  apartmentId: string | null;
  householdTimezone: string;
  isAdminMode: boolean;
}

export const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: React.ReactNode;
  householdId: string; 
  apartmentId: string | null;
  householdTimezone: string;
  isAdminMode: boolean;
}


// BookingContext.tsx
export const BookingProvider: React.FC<BookingProviderProps> = ({ children, householdId, apartmentId, householdTimezone, isAdminMode }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  // INPUT INTEGRITY GUARD: Validates state parameters on mounting/updating transitions
  useEffect(() => {
    // Rule 1: Admin Mode sessions must never carry a personal resident apartment ID scope
    if (isAdminMode && apartmentId !== null) {
      console.warn(
        "BookingProvider Conflict: Admin Mode is active, but an apartmentId was still supplied. Overriding apartment context to null."
      );
    }

    // Rule 2: Resident Mode sessions must absolutely contain a valid apartment target identifier
    if (!isAdminMode && !apartmentId) {
      console.error(
        "BookingProvider Failure: Resident Mode is active, but no apartmentId was provided. Calendar operations will fail."
      );
    }
  }, [isAdminMode, apartmentId]);
  
  return (
    <BookingContext.Provider 
      value={{ 
        viewDate, 
        setViewDate, 
        householdId, 
        apartmentId: isAdminMode ? null : apartmentId, 
        householdTimezone, 
        isAdminMode 
      }}>
      {children}
    </BookingContext.Provider>
  );
};
