'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface CityFilterContextType {
  citySlug: string;
  cityName: string;
  setCitySlug: (slug: string) => void;
  filterEvents: <T extends { city?: { slug?: string } | null }>(events: T[]) => T[];
}

const CityFilterContext = createContext<CityFilterContextType>({
  citySlug: '',
  cityName: '',
  setCitySlug: () => {},
  filterEvents: (events) => events,
});

export function useCityFilter() {
  return useContext(CityFilterContext);
}

// City slug to display name map
const CITY_NAMES: Record<string, string> = {
  cdmx: 'Ciudad de México',
  madrid: 'Madrid',
  barcelona: 'Barcelona',
  'new-york': 'New York',
  london: 'London',
  paris: 'Paris',
};

export default function CityFilterProvider({ children }: { children: ReactNode }) {
  const [citySlug, setCitySlugState] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ctxplorer-city');
    if (saved) setCitySlugState(saved);
  }, []);

  const setCitySlug = useCallback((slug: string) => {
    setCitySlugState(slug);
    if (slug) localStorage.setItem('ctxplorer-city', slug);
    else localStorage.removeItem('ctxplorer-city');
  }, []);

  const filterEvents = useCallback(<T extends { city?: { slug?: string } | null }>(events: T[]): T[] => {
    if (!citySlug) return events;
    return events.filter(e => e.city?.slug === citySlug);
  }, [citySlug]);

  return (
    <CityFilterContext.Provider value={{ citySlug, cityName: CITY_NAMES[citySlug] || citySlug, setCitySlug, filterEvents }}>
      {children}
    </CityFilterContext.Provider>
  );
}
