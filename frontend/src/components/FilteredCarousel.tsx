'use client';
import { useCityFilter } from './CityFilterProvider';
import EventCarousel from './EventCarousel';
import { Event } from '@/lib/api';

interface FilteredCarouselProps {
  events: Event[];
  title: string;
  loading?: boolean;
  viewAllHref?: string;
  favoriteIds?: string[];
}

export default function FilteredCarousel({
  events,
  title,
  loading,
  viewAllHref,
  favoriteIds,
}: FilteredCarouselProps) {
  const { filterEvents } = useCityFilter();
  const filtered = filterEvents(events);
  if (filtered.length === 0) return null;
  return (
    <EventCarousel
      events={filtered}
      title={title}
      loading={loading}
      viewAllHref={viewAllHref}
      favoriteIds={favoriteIds}
    />
  );
}
