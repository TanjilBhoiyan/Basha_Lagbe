import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_FILTERS, type PropertyFilters } from './filters';

type FiltersContextValue = {
  filters: PropertyFilters;
  setFilters: (next: PropertyFilters) => void;
  /** Update a few fields without touching the rest. */
  updateFilters: (patch: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
};

const FiltersContext = createContext<FiltersContextValue | null>(null);

/** Shares the active search filters between Home, the Filters screen and Search. */
export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);

  const value = useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilters,
      updateFilters: (patch) => setFilters((f) => ({ ...f, ...patch })),
      resetFilters: () => setFilters(DEFAULT_FILTERS),
    }),
    [filters],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used inside <FiltersProvider>');
  return ctx;
}