import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/api';
import EventDetailClient from './EventDetailClient';

export const dynamic = 'force-dynamic';

function transformEvent(row: Record<string, unknown>): Event {
  const city = row.cities as Record<string, unknown> | null;
  const category = row.categories as Record<string, unknown> | null;
  return {
    id: String(row.id),
    title: row.title as string,
    slug: row.slug as string,
    description: (row.description as string) || '',
    shortDescription: row.short_description as string | undefined,
    image: row.image as string | undefined,
    price: row.price as number,
    originalPrice: row.original_price as number | undefined,
    date: row.date as string,
    endDate: row.end_date as string | undefined,
    time: row.time as string | undefined,
    duration: row.duration as string | undefined,
    address: row.address as string | undefined,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    status: row.status as string,
    featured: row.featured as boolean,
    capacity: row.capacity as number | undefined,
    soldCount: row.sold_count as number | undefined,
    rating: row.rating as number | undefined,
    reviewCount: row.review_count as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    city: city
      ? {
          id: String(city.id),
          name: city.name as string,
          slug: city.slug as string,
          image: city.image as string | undefined,
          country: city.country as string,
        }
      : null,
    category: category
      ? {
          id: String(category.id),
          name: category.name as string,
          slug: category.slug as string,
          icon: category.icon as string | undefined,
          color: category.color as string | undefined,
        }
      : null,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch event server-side
  const { data: row, error } = await supabase
    .from('events')
    .select('*, cities(*), categories(*)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  if (error || !row) {
    notFound();
  }

  const event = transformEvent(row);

  // Fetch related events
  let related: Event[] = [];
  if (event.category) {
    const { data: relatedRows } = await supabase
      .from('events')
      .select('*, cities(*), categories(*)')
      .eq('status', 'PUBLISHED')
      .eq('category_id', Number(event.category.id))
      .neq('id', Number(event.id))
      .order('date', { ascending: true })
      .limit(12);
    related = (relatedRows || []).map(transformEvent);
  }

  return <EventDetailClient event={event} related={related} />;
}
