'use client';

import { useCityFilter } from './CityFilterProvider';
import { Event } from '@/lib/api';
import { ReactNode } from 'react';

interface FilteredSectionProps {
  events: Event[];
  children: (filteredEvents: Event[]) => ReactNode;
}

export default function FilteredSection({ events, children }: FilteredSectionProps) {
  const { filterEvents } = useCityFilter();
  const filtered = filterEvents(events);
  if (filtered.length === 0) return null;
  return <>{children(filtered)}</>;
}
