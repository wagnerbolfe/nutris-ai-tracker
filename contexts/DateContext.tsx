import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedDateString: string; // Helper for YYYY-MM-DD
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Helper formatting directly to YYYY-MM-DD (safe format for firestore)
  const formatToYYYYMMDD = (d: Date) => {
    const offset = d.getTimezoneOffset()
    const safeDate = new Date(d.getTime() - (offset*60*1000))
    return safeDate.toISOString().split('T')[0]
  };

  const selectedDateString = formatToYYYYMMDD(selectedDate);

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate, selectedDateString }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
}
