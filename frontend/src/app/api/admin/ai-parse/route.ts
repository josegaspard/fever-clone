import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-helpers';

// ── City keyword map ────────────────────────────────────────────────────────
const CITY_KEYWORDS: Record<string, string[]> = {
  'ciudad-de-mexico': ['cdmx', 'ciudad de mexico', 'ciudad de méxico', 'df', 'mexico city', 'ciudad de mexic'],
  'madrid': ['madrid'],
  'barcelona': ['barcelona', 'bcn', 'barna'],
  'new-york': ['new york', 'nyc', 'nueva york', 'manhattan', 'brooklyn'],
  'london': ['london', 'londres'],
  'paris': ['paris', 'parís'],
  'buenos-aires': ['buenos aires', 'bsas', 'caba'],
  'bogota': ['bogota', 'bogotá'],
  'lima': ['lima'],
  'monterrey': ['monterrey', 'mty'],
  'guadalajara': ['guadalajara', 'gdl'],
};

// ── Category keyword map ────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'conciertos': ['concierto', 'concert', 'musica', 'música', 'dj', 'banda', 'live music', 'festival musical', 'recital', 'sinfonica', 'sinfónica', 'orquesta', 'rock', 'pop', 'reggaeton', 'reggaetón', 'rap', 'hip hop', 'jazz', 'blues', 'electronica', 'electrónica', 'cumbia', 'salsa'],
  'gastronomia': ['comida', 'restaurante', 'cena', 'degustacion', 'degustación', 'chef', 'food', 'gastro', 'cocina', 'gastronomia', 'gastronomía', 'brunch', 'tasting', 'vino', 'wine', 'cerveza', 'beer', 'mezcal', 'tequila', 'maridaje', 'culinario'],
  'arte': ['arte', 'galeria', 'galería', 'exposicion', 'exposición', 'museum', 'museo', 'pintura', 'escultura', 'fotografia', 'fotografía', 'instalacion', 'instalación', 'muestra', 'exhibicion', 'exhibición'],
  'teatro': ['teatro', 'obra', 'musical', 'performance', 'escena', 'dramaturgia', 'comedia', 'monólogo', 'monologo', 'stand up', 'standup', 'improv', 'improvisacion', 'improvisación'],
  'festivales': ['festival', 'feria', 'carnaval', 'fiesta patronal', 'kermesse', 'kermés', 'celebracion', 'celebración'],
  'deportes': ['deporte', 'deportes', 'futbol', 'fútbol', 'carrera', 'maraton', 'maratón', 'gym', 'fitness', 'yoga', 'basketball', 'basquetbol', 'tenis', 'boxeo', 'mma', 'ciclismo', 'natacion', 'natación', 'running', 'crossfit'],
  'nightlife': ['fiesta', 'club', 'noche', 'antro', 'bar', 'nightclub', 'discoteca', 'after', 'rave', 'techno', 'house music', 'bottle service'],
  'tours': ['tour', 'recorrido', 'visita', 'guiado', 'excursion', 'excursión', 'paseo', 'caminata', 'senderismo', 'hiking', 'walking tour'],
  'talleres': ['taller', 'workshop', 'clase', 'curso', 'masterclass', 'seminario', 'capacitacion', 'capacitación', 'conferencia', 'charla', 'webinar'],
  'infantil': ['niños', 'ninos', 'infantil', 'familia', 'kids', 'children', 'familiar'],
};

// ── Month names for date parsing ────────────────────────────────────────────
const MONTHS_ES: Record<string, string> = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
  'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
  'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
};

const MONTHS_EN: Record<string, string> = {
  'january': '01', 'february': '02', 'march': '03', 'april': '04',
  'may': '05', 'june': '06', 'july': '07', 'august': '08',
  'september': '09', 'october': '10', 'november': '11', 'december': '12',
  'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
  'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
  'oct': '10', 'nov': '11', 'dec': '12',
};

// ── Slugify ────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

// ── Extract title ──────────────────────────────────────────────────────────
function extractTitle(content: string): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return '';

  // First line if under 100 chars
  if (lines[0].length <= 100) return lines[0];

  // First sentence under 100 chars
  const firstSentence = content.match(/^[^.!?\n]{10,100}[.!?]?/);
  if (firstSentence) return firstSentence[0].replace(/[.!?]$/, '').trim();

  // Truncate first line
  return lines[0].slice(0, 100).trim();
}

// ── Extract dates ──────────────────────────────────────────────────────────
function extractDate(content: string): string | null {
  const lower = content.toLowerCase();

  // YYYY-MM-DD
  const iso = content.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = content.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${month}-${day}`;
  }

  // "25 de marzo de 2026" or "25 de marzo, 2026"
  const esDate = lower.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de|\s*,)?\s*(\d{4})/);
  if (esDate) {
    const day = esDate[1].padStart(2, '0');
    const month = MONTHS_ES[esDate[2]];
    return `${esDate[3]}-${month}-${day}`;
  }

  // "March 25, 2026" or "March 25 2026"
  const allMonths = { ...MONTHS_EN };
  const monthNames = Object.keys(allMonths).join('|');
  const enRegex = new RegExp(`(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?[,\\s]+(\\d{4})`, 'i');
  const enDate = lower.match(enRegex);
  if (enDate) {
    const month = allMonths[enDate[1].toLowerCase()];
    const day = enDate[2].padStart(2, '0');
    return `${enDate[3]}-${month}-${day}`;
  }

  // "25 March 2026"
  const enDate2Regex = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})[,\\s]+(\\d{4})`, 'i');
  const enDate2 = lower.match(enDate2Regex);
  if (enDate2) {
    const day = enDate2[1].padStart(2, '0');
    const month = allMonths[enDate2[2].toLowerCase()];
    return `${enDate2[3]}-${month}-${day}`;
  }

  return null;
}

// ── Extract time ───────────────────────────────────────────────────────────
function extractTime(content: string): string | null {
  const lower = content.toLowerCase();

  // "a las 20:00", "a las 8:30 pm"
  const alas = lower.match(/a\s+las\s+(\d{1,2}):(\d{2})(?:\s*(am|pm))?/);
  if (alas) {
    let hour = parseInt(alas[1]);
    const min = alas[2];
    if (alas[3] === 'pm' && hour < 12) hour += 12;
    if (alas[3] === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${min}`;
  }

  // "8:30pm", "8:30 pm", "20:00"
  const timeMatch = lower.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const min = timeMatch[2];
    if (timeMatch[3] === 'pm' && hour < 12) hour += 12;
    if (timeMatch[3] === 'am' && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:${min}`;
    }
  }

  // "8pm", "10 am"
  const simpleTime = lower.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (simpleTime) {
    let hour = parseInt(simpleTime[1]);
    if (simpleTime[2] === 'pm' && hour < 12) hour += 12;
    if (simpleTime[2] === 'am' && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:00`;
    }
  }

  return null;
}

// ── Extract price ──────────────────────────────────────────────────────────
function extractPrice(content: string): { price: number | null; currency: string | null } {
  const lower = content.toLowerCase();

  // "$500", "$ 500", "$500.00"
  const dollarMatch = content.match(/\$\s?(\d+(?:[.,]\d{1,2})?)/);
  if (dollarMatch) {
    const price = parseFloat(dollarMatch[1].replace(',', '.'));
    // Check if MXN context
    const hasMXN = lower.includes('mxn') || lower.includes('pesos') || lower.includes('peso');
    return { price, currency: hasMXN ? 'MXN' : 'USD' };
  }

  // "€45", "45€"
  const euroMatch = content.match(/(?:€\s?(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s?€)/);
  if (euroMatch) {
    const val = euroMatch[1] || euroMatch[2];
    return { price: parseFloat(val.replace(',', '.')), currency: 'EUR' };
  }

  // "£30"
  const poundMatch = content.match(/(?:£\s?(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s?£)/);
  if (poundMatch) {
    const val = poundMatch[1] || poundMatch[2];
    return { price: parseFloat(val.replace(',', '.')), currency: 'GBP' };
  }

  // "500 MXN", "500 USD", "500 EUR"
  const currencyMatch = content.match(/(\d+(?:[.,]\d{1,2})?)\s*(MXN|USD|EUR|GBP|pesos?)/i);
  if (currencyMatch) {
    const price = parseFloat(currencyMatch[1].replace(',', '.'));
    let currency = currencyMatch[2].toUpperCase();
    if (currency === 'PESO' || currency === 'PESOS') currency = 'MXN';
    return { price, currency };
  }

  // "precio: 300", "costo: 250", "price: 100"
  const namedPrice = lower.match(/(?:precio|costo|price|cost|entrada|cover|boleto)[\s:]+\$?\s?(\d+(?:[.,]\d{1,2})?)/);
  if (namedPrice) {
    return { price: parseFloat(namedPrice[1].replace(',', '.')), currency: null };
  }

  // Free event detection
  if (lower.match(/\b(gratis|gratuito|free|sin\s+costo|entrada\s+libre)\b/)) {
    return { price: 0, currency: null };
  }

  return { price: null, currency: null };
}

// ── Extract duration ───────────────────────────────────────────────────────
function extractDuration(content: string): string | null {
  const lower = content.toLowerCase();

  // "2 horas", "3 hrs", "1 hora"
  const horasMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:horas?|hrs?)\s*(?:(?:y|con)\s*(\d+)\s*(?:minutos?|mins?|min))?/);
  if (horasMatch) {
    let result = `${horasMatch[1]} hora${parseFloat(horasMatch[1]) !== 1 ? 's' : ''}`;
    if (horasMatch[2]) result += ` ${horasMatch[2]} min`;
    return result;
  }

  // "90 minutos", "45 min"
  const minMatch = lower.match(/(\d+)\s*(?:minutos?|mins?|minutes?)/);
  if (minMatch) {
    const mins = parseInt(minMatch[1]);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h} hora${h !== 1 ? 's' : ''} ${m} min` : `${h} hora${h !== 1 ? 's' : ''}`;
    }
    return `${mins} minutos`;
  }

  // "3h30", "2h", "1h30m"
  const shortMatch = lower.match(/(\d+)h(?:(\d+)(?:m(?:in)?)?)?/);
  if (shortMatch) {
    const h = shortMatch[1];
    const m = shortMatch[2];
    let result = `${h} hora${parseInt(h) !== 1 ? 's' : ''}`;
    if (m) result += ` ${m} min`;
    return result;
  }

  // "duration: X hours"
  const enDuration = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?)/);
  if (enDuration) {
    const h = parseFloat(enDuration[1]);
    return `${h} hora${h !== 1 ? 's' : ''}`;
  }

  return null;
}

// ── Detect city ────────────────────────────────────────────────────────────
function detectCity(content: string): string | null {
  const lower = content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const [slug, keywords] of Object.entries(CITY_KEYWORDS)) {
    for (const kw of keywords) {
      const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalizedKw)) {
        return slug;
      }
    }
  }

  return null;
}

// ── Detect category ────────────────────────────────────────────────────────
function detectCategory(content: string): string | null {
  const lower = content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let bestMatch: string | null = null;
  let bestCount = 0;

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(normalizedKw)) {
        count++;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestMatch = slug;
    }
  }

  return bestCount > 0 ? bestMatch : null;
}

// ── Extract address ────────────────────────────────────────────────────────
function extractAddress(content: string): string | null {
  // Look for labeled addresses
  const labeled = content.match(/(?:(?:lugar|direccion|dirección|ubicacion|ubicación|venue|address|location|sede|donde)\s*[:]\s*)([^\n]{5,120})/i);
  if (labeled) return labeled[1].trim();

  // Look for typical address patterns
  const addressPatterns = [
    // "Calle ... #123" or "Av. ..."
    /(?:Calle|Av\.?|Avenida|Blvd\.?|Boulevard|Calz\.?|Calzada|Paseo|Carrera|Prolongacion)\s+[A-Za-zÀ-ÿ0-9\s.]+(?:#\s*\d+[A-Za-z]?)?(?:\s*,\s*Col\.?\s+[A-Za-zÀ-ÿ\s]+)?/i,
    // Street with number
    /\d+\s+(?:Calle|Av\.?|Avenida|Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?)\s+[A-Za-zÀ-ÿ\s]+/i,
  ];

  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) return match[0].trim();
  }

  return null;
}

// ── Main parser ────────────────────────────────────────────────────────────
function parseEventContent(content: string, images: string[], links: string[]) {
  const title = extractTitle(content);
  const date = extractDate(content);
  const time = extractTime(content);
  const { price, currency } = extractPrice(content);
  const duration = extractDuration(content);
  const citySlug = detectCity(content);
  const categorySlug = detectCategory(content);
  const address = extractAddress(content);
  const slug = slugify(title);

  // Clean up description - remove first line if it's the title
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const description = lines.length > 1 && lines[0] === title
    ? lines.slice(1).join('\n').trim()
    : content.trim();

  const shortDescription = description.slice(0, 150).trim() + (description.length > 150 ? '...' : '');

  // SEO fields
  const metaTitle = title ? `${title.slice(0, 55)} | Fever` : '';
  const metaDescription = shortDescription.slice(0, 155);

  // Image from provided images or detect from content
  const mainImage = images.length > 0 ? images[0] : null;
  const gallery = images.length > 1 ? images.slice(1) : [];

  // Detected fields tracking
  const detected: Record<string, boolean> = {
    title: !!title,
    description: !!description,
    shortDescription: !!shortDescription,
    date: !!date,
    time: !!time,
    price: price !== null,
    currency: !!currency,
    duration: !!duration,
    city: !!citySlug,
    category: !!categorySlug,
    address: !!address,
    slug: !!slug,
    metaTitle: !!metaTitle,
    metaDescription: !!metaDescription,
    image: !!mainImage,
    gallery: gallery.length > 0,
  };

  return {
    title,
    slug,
    description,
    shortDescription,
    image: mainImage,
    gallery,
    videoUrl: null,
    price: price !== null ? price : null,
    originalPrice: null,
    currency: currency || 'MXN',
    date,
    endDate: null,
    time,
    duration,
    citySlug,
    categorySlug,
    address,
    lat: null,
    lng: null,
    capacity: null,
    status: 'DRAFT',
    featured: false,
    metaTitle,
    metaDescription,
    links,
    detected,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || (user.userType || '').toUpperCase() !== 'SUPERADMIN') {
      return NextResponse.json(
        { message: 'No autorizado. Se requiere rol SUPERADMIN.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, images, links } = body as {
      content: string;
      images: string[];
      links: string[];
    };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { message: 'El campo "content" es obligatorio.' },
        { status: 400 }
      );
    }

    const cleanImages = (images || []).filter((u: string) => typeof u === 'string' && u.trim());
    const cleanLinks = (links || []).filter((u: string) => typeof u === 'string' && u.trim());

    const result = parseEventContent(content.trim(), cleanImages, cleanLinks);

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI parse error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
