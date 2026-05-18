import { supabase } from '@/lib/supabase';

const BUCKET = 'media';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Descarga una imagen desde URL externa y la sube a Supabase Storage.
 * Devuelve la URL publica o null si falla. Si la URL ya es del bucket Supabase, la devuelve sin tocar.
 *
 * @param externalUrl URL externa de la imagen
 * @param keyPrefix p.ej. "events/cdmx/" - se concatena con un nombre derivado del slug
 * @param slug slug base usado para el filename
 */
export async function downloadAndStoreImage(
  externalUrl: string | null | undefined,
  keyPrefix: string,
  slug: string
): Promise<string | null> {
  if (!externalUrl || typeof externalUrl !== 'string') return null;
  // Ya es de nuestro CDN, no tocar
  if (externalUrl.includes('.supabase.co/storage/v1/object/public/')) {
    return externalUrl;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return externalUrl;

  // Detect extension
  let extFromUrl = '';
  try {
    const pathOnly = new URL(externalUrl).pathname;
    const dot = pathOnly.lastIndexOf('.');
    if (dot > 0) extFromUrl = pathOnly.slice(dot + 1).toLowerCase().split('/')[0];
  } catch {
    return externalUrl;
  }

  try {
    const res = await fetch(externalUrl, {
      headers: { 'User-Agent': UA, Accept: 'image/*' },
      // 10s timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return externalUrl;

    const contentType = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
    let ext = EXT_BY_MIME[contentType] || (extFromUrl in MIME_BY_EXT ? extFromUrl : 'jpg');
    let mime = EXT_BY_MIME[contentType] ? contentType : MIME_BY_EXT[ext] || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      // fallback por extension
      mime = MIME_BY_EXT[ext] || 'image/jpeg';
    }

    const arrayBuf = await res.arrayBuffer();
    const buf = new Uint8Array(arrayBuf);
    if (buf.byteLength === 0) return externalUrl;
    if (buf.byteLength > 9_900_000) return externalUrl; // > ~9.4MB, evita 10MB cap

    const safeSlug = slug.replace(/[^a-z0-9-]/g, '').slice(0, 80) || 'event';
    const path = `${keyPrefix.replace(/\/$/, '')}/${safeSlug}.${ext}`.replace(/^\/+/, '');

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: mime,
      upsert: true,
      cacheControl: '604800', // 7 days
    });
    if (upErr) {
      // posible mime no permitido, fallback a URL externa
      return externalUrl;
    }

    return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch {
    return externalUrl;
  }
}
