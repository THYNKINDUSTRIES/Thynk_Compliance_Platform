import React, { createContext, useContext, useState } from 'react';

export interface FilterState {
  search: string;
  jurisdictions: string[];
  authorities: string[];
  statuses: string[];
  impactLevels: string[];
  products: string[];
  stages: string[];
  types: string[];
  dateFrom: string;
  dateTo: string;
  tags: string[];
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: (key: keyof FilterState, value: any) => void;
  clearFilters: () => void;
}

const defaultFilters: FilterState = {
  search: '',
  jurisdictions: [],
  authorities: [],
  statuses: [],
  impactLevels: [],
  products: [],
  stages: [],
  types: [],
  dateFrom: '',
  dateTo: '',
  tags: [],
};

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  filters: defaultFilters,
  setFilters: () => {},
  updateFilter: () => {},
  clearFilters: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    console.log('🎯 AppContext: Updating filter', key, '=', value);
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      console.log('🎯 AppContext: New filter state:', newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    console.log('🧹 AppContext: Clearing all filters');
    setFilters(defaultFilters);
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        filters,
        setFilters,
        updateFilter,
        clearFilters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

