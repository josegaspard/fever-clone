import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// High-quality Unsplash images organized by category keywords
const CATEGORY_IMAGES: Record<string, string[]> = {
  conciertos: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop&q=80',
  ],
  musica: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=1000&fit=crop&q=80',
  ],
  teatro: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=1000&fit=crop&q=80',
  ],
  gastronomia: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=1000&fit=crop&q=80',
  ],
  arte: [
    'https://images.unsplash.com/photo-1531913764164-f85c3e01b1aa?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=1000&fit=crop&q=80',
  ],
  festivales: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=800&h=1000&fit=crop&q=80',
  ],
  deportes: [
    'https://images.unsplash.com/photo-1461896836934-bd45ba7e6bd7?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1000&fit=crop&q=80',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=1000&fit=crop&q=80',
  ],
  museos: [
    'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=1000&fit=crop&q=80',
  ],
  tours: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&h=1000&fit=crop&q=80',
  ],
  talleres: [
    'https://images.unsplash.com/photo-1452860606245-08f33eee919d?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560439513-74b037a25d84?w=800&h=1000&fit=crop&q=80',
  ],
  'experiencias-inmersivas': [
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=1000&fit=crop&q=80',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=1000&fit=crop&q=80',
  ],
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=1000&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=1000&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=1000&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=1000&fit=crop&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=1000&fit=crop&q=80',
];

// Lightweight video URLs from Pixabay (short, under 5MB)
const CATEGORY_VIDEOS: Record<string, string> = {
  conciertos: 'https://cdn.pixabay.com/video/2019/06/07/24368-341048498_large.mp4',
  festivales: 'https://cdn.pixabay.com/video/2020/05/25/38745-424958037_large.mp4',
  nightlife: 'https://cdn.pixabay.com/video/2020/02/10/32180-391024670_large.mp4',
  gastronomia: 'https://cdn.pixabay.com/video/2021/02/14/64560-512693498_large.mp4',
};

export async function POST() {
  try {
    // Get all events with their category slugs
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, image, video_url, categories(slug)')
      .order('id');

    if (error) throw error;
    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events found', updated: 0 });
    }

    let updated = 0;
    const updates: { id: number; image: string; video_url?: string }[] = [];

    for (const event of events) {
      const catSlug = (event.categories as unknown as Record<string, unknown>)?.slug as string || '';
      const images = CATEGORY_IMAGES[catSlug] || FALLBACK_IMAGES;

      // Pick a deterministic image based on event ID to avoid all same
      const imageIndex = (event.id as number) % images.length;
      const newImage = images[imageIndex];

      const update: { id: number; image: string; video_url?: string } = {
        id: event.id as number,
        image: newImage,
      };

      // Add video for some events (those in categories with videos, ~30% chance)
      if (CATEGORY_VIDEOS[catSlug] && (event.id as number) % 3 === 0) {
        update.video_url = CATEGORY_VIDEOS[catSlug];
      }

      updates.push(update);
    }

    // Batch update
    for (const upd of updates) {
      const updateData: Record<string, unknown> = { image: upd.image };
      if (upd.video_url) updateData.video_url = upd.video_url;

      const { error: updateError } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', upd.id);

      if (!updateError) updated++;
    }

    return NextResponse.json({
      message: `Updated ${updated} of ${events.length} events with real images`,
      updated,
      total: events.length,
    });
  } catch (err) {
    console.error('Fix images error:', err);
    return NextResponse.json({ error: 'Failed to update images' }, { status: 500 });
  }
}
