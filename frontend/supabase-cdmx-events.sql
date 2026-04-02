-- ============================================================================
-- CDMX EVENTS + IMAGE UPDATES
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. Update ALL events that have no image or placeholder
UPDATE events SET image = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=500&fit=crop'
WHERE image IS NULL OR image = '' OR image LIKE '%placeholder%';

-- 2. Insert new CDMX events with real images

-- América vs Chivas - Clásico Nacional
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status, original_price)
VALUES (
  'Partido América vs Chivas - Clásico Nacional',
  'america-vs-chivas-clasico-nacional',
  'Vive la emocion del Clásico Nacional en el Estadio Azteca. América recibe a las Chivas en un duelo que paraliza a todo México. Ambiente inolvidable, la mejor porra y futbol de primer nivel. No te lo pierdas.',
  '2026-05-10',
  '19:00',
  '2h 30min',
  450,
  'MXN',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=800&h=500&fit=crop"]',
  6, 7,
  'Estadio Azteca, Calzada de Tlalpan 3465, CDMX',
  19.3029, -99.1505,
  87000, 72000, true, 'PUBLISHED', 600
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image,
  gallery = EXCLUDED.gallery, featured = EXCLUDED.featured, price = EXCLUDED.price;

-- Museo Frida Kahlo - Casa Azul
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Museo Frida Kahlo - Casa Azul',
  'museo-frida-kahlo-casa-azul',
  'Visita la iconica Casa Azul donde nacio y vivio Frida Kahlo. Recorre sus espacios mas intimos, su estudio, jardin y coleccion personal. Una experiencia unica que conecta con el arte y la historia de Mexico.',
  '2026-05-08',
  '10:00',
  '2h',
  250,
  'MXN',
  'https://images.unsplash.com/photo-1613735628859-d1ceb9e0e9b6?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&h=500&fit=crop"]',
  6, 2,
  'Londres 247, Del Carmen, Coyoacan, CDMX',
  19.3554, -99.1626,
  200, 180, true, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image, gallery = EXCLUDED.gallery;

-- Museo Nacional de Antropología
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Museo Nacional de Antropología - Visita Guiada',
  'museo-antropologia-visita-guiada',
  'Descubre la riqueza cultural de Mesoamerica en el museo mas importante de America Latina. Tour guiado por la Piedra del Sol, las salas maya, azteca y mucho mas. Incluye guia experto bilingue.',
  '2026-05-12',
  '11:00',
  '3h',
  180,
  'MXN',
  'https://images.unsplash.com/photo-1568736333610-eae6e0d0a2cd?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&h=500&fit=crop"]',
  6, 2,
  'Av. Paseo de la Reforma, Chapultepec Polanco, CDMX',
  19.4260, -99.1862,
  500, 320, false, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image, gallery = EXCLUDED.gallery;

-- Lucha Libre en la Arena México
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Lucha Libre AAA en Arena México',
  'lucha-libre-arena-mexico',
  'La experiencia mas mexicana que puedes vivir. Mascaras, llaves, porras y mucha adrenalina. Lucha libre de primer nivel con los mejores gladiadores del ring. Incluye acceso a zona de fotos con luchadores.',
  '2026-05-09',
  '20:00',
  '3h',
  350,
  'MXN',
  'https://images.unsplash.com/photo-1564077528854-b35c9f tried?w=800&h=500&fit=crop',
  '[]',
  6, 7,
  'Dr. Lavista 189, Doctores, CDMX',
  19.4178, -99.1446,
  16500, 14200, true, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image;

-- Concierto en el Auditorio Nacional
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status, original_price)
VALUES (
  'Festival de Jazz en Auditorio Nacional',
  'festival-jazz-auditorio-nacional',
  'Una noche magica de jazz con artistas nacionales e internacionales en el recinto mas prestigioso de Mexico. Sonidos que van del bebop al jazz contemporaneo en una acustica perfecta.',
  '2026-05-15',
  '20:30',
  '3h',
  800,
  'MXN',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=500&fit=crop"]',
  6, 1,
  'Av. Paseo de la Reforma 50, Polanco, CDMX',
  19.4225, -99.1920,
  10000, 7500, true, 'PUBLISHED', 1200
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image, gallery = EXCLUDED.gallery;

-- Mercado de Coyoacán - Tour Gastronómico
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Tour Gastronómico por Mercado de Coyoacán',
  'tour-gastronomico-coyoacan',
  'Recorre el mercado mas emblematico de Coyoacan probando tostadas, esquites, nieves artesanales y mas. Guia local que te cuenta la historia detras de cada puesto. Incluye 6 degustaciones.',
  '2026-05-11',
  '12:00',
  '2h 30min',
  0,
  'MXN',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop"]',
  6, 3,
  'Ignacio Allende 2, Del Carmen, Coyoacan, CDMX',
  19.3500, -99.1620,
  30, 28, false, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image, gallery = EXCLUDED.gallery;

-- Yoga en Bosque de Chapultepec
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Yoga al Amanecer en Chapultepec',
  'yoga-amanecer-chapultepec',
  'Empieza tu dia con energia. Sesion de yoga al aire libre rodeado de la naturaleza del Bosque de Chapultepec. Todos los niveles bienvenidos. Incluye tapete y agua.',
  '2026-05-13',
  '07:00',
  '1h 30min',
  0,
  'MXN',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
  '[]',
  6, 8,
  'Bosque de Chapultepec 1a Seccion, CDMX',
  19.4204, -99.1893,
  50, 45, false, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image;

-- Xochimilco en Trajinera
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Tour en Trajinera por Xochimilco',
  'tour-trajinera-xochimilco',
  'Navega por los canales patrimonio de la humanidad en una colorida trajinera. Musica en vivo, comida tipica y un paseo unico. Perfecto para grupos y parejas.',
  '2026-05-14',
  '13:00',
  '3h',
  200,
  'MXN',
  'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1570003179394-4523f50e1f09?w=800&h=500&fit=crop"]',
  6, 9,
  'Embarcadero Nuevo Nativitas, Xochimilco, CDMX',
  19.2698, -99.1049,
  20, 16, false, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image, gallery = EXCLUDED.gallery;

-- Teatro - Obra en Bellas Artes
INSERT INTO events (title, slug, description, date, time, duration, price, currency, image, gallery, city_id, category_id, address, lat, lng, capacity, sold_count, featured, status)
VALUES (
  'Ballet Folklórico de México en Bellas Artes',
  'ballet-folklorico-bellas-artes',
  'El espectaculo mas representativo de la cultura mexicana en el recinto mas hermoso del pais. Danzas de todas las regiones, vestuario espectacular y musica en vivo.',
  '2026-05-16',
  '19:00',
  '2h',
  500,
  'MXN',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop"]',
  6, 4,
  'Av. Juárez, Centro Historico, CDMX',
  19.4352, -99.1413,
  1800, 1600, true, 'PUBLISHED'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image = EXCLUDED.image, gallery = EXCLUDED.gallery;

-- Fix: update image for lucha libre (broken URL above)
UPDATE events SET image = 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=500&fit=crop'
WHERE slug = 'lucha-libre-arena-mexico' AND (image IS NULL OR image LIKE '%tried%');
