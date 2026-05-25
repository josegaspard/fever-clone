import { NextResponse, type NextRequest } from 'next/server';

/**
 * Returns HTTP 410 Gone for `/events/<slug>` requests where the slug no longer
 * exists in the database. This is the correct SEO signal for events that were
 * removed permanently — Google de-indexes 410s noticeably faster than 404s.
 *
 * The check is a single REST fetch to Supabase (HEAD-like, returns count only).
 * Cached for 5 minutes per slug via the Edge runtime fetch cache.
 *
 * Live events fall through to the page.tsx, which does its own full fetch.
 *
 * Background: as of 2026-05-25 GSC was reporting 52 "404 not found" errors,
 * all of which were expired events removed from the DB (e.g. yoga-amanecer-
 * chapultepec, lucha-libre-arena-mexico). They had been indexed and were
 * accruing impressions, then started returning 404 once expired. 410 tells
 * Google "this is intentionally gone" so they drop from the index promptly.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/events/')) return NextResponse.next();

  // Extract slug — only handle bare /events/<slug>, not sub-paths
  const after = pathname.slice('/events/'.length);
  if (!after || after.includes('/')) return NextResponse.next();
  const slug = decodeURIComponent(after);

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supaUrl || !supaKey) return NextResponse.next();

  // Quick existence check — `Prefer: count=exact` + `HEAD` returns no body, just
  // a content-range header with the row count. Fast and cheap.
  try {
    const res = await fetch(
      `${supaUrl}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=id`,
      {
        method: 'HEAD',
        headers: {
          apikey: supaKey,
          Authorization: `Bearer ${supaKey}`,
          Prefer: 'count=exact',
        },
        // Edge cache to avoid hammering Supabase on hot paths
        next: { revalidate: 300, tags: [`event-slug:${slug}`] },
      }
    );
    const range = res.headers.get('content-range') || '';
    const count = parseInt(range.split('/')[1] || '0', 10);
    if (count === 0) {
      return new NextResponse(
        '<!doctype html><meta charset="utf-8"><title>410 Gone — CTXplorer</title>' +
          '<h1>This event no longer exists</h1>' +
          '<p>The event you are looking for has been removed.</p>' +
          '<p><a href="/eventos-este-fin-de-semana">See current events this weekend</a> · ' +
          '<a href="/eventos-gratis">Free events</a> · ' +
          '<a href="/">Home</a></p>',
        {
          status: 410,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=300, s-maxage=86400',
            'x-robots-tag': 'noindex, nofollow',
          },
        }
      );
    }
  } catch {
    // On any fetch error, fall through — page.tsx will handle and 404 as before.
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/events/:path*',
};
