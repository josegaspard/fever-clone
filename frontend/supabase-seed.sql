-- ============================================================================
-- FEVER CLONE - SUPABASE SEED DATA
-- Updates existing events with real images and videos.
-- Also ensures 6 cities and 10 categories exist.
-- Run this in your Supabase SQL Editor after the migration.
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. CITIES - Upsert 6 cities with real Unsplash images
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO cities (id, name, slug, image, country) VALUES
  (1, 'Madrid', 'madrid',
   'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=500&fit=crop',
   'Spain'),
  (2, 'Barcelona', 'barcelona',
   'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=500&fit=crop',
   'Spain'),
  (3, 'New York', 'new-york',
   'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop',
   'United States'),
  (4, 'London', 'london',
   'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop',
   'United Kingdom'),
  (5, 'Paris', 'paris',
   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop',
   'France'),
  (6, 'Ciudad de Mexico', 'cdmx',
   'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&h=500&fit=crop',
   'Mexico')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  image = EXCLUDED.image,
  country = EXCLUDED.country;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. CATEGORIES - Upsert 10 categories
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO categories (id, name, slug, icon, color) VALUES
  (1,  'Conciertos',           'conciertos',     '🎵', '#e63946'),
  (2,  'Arte y Museos',        'arte',           '🎨', '#457b9d'),
  (3,  'Gastronomia',          'gastronomia',    '🍽️', '#f4a261'),
  (4,  'Teatro',               'teatro',         '🎭', '#9b5de5'),
  (5,  'Festivales',           'festivales',     '🎪', '#ff6b6b'),
  (6,  'Experiencias Inmersivas', 'inmersivo',   '✨', '#06d6a0'),
  (7,  'Deportes',             'deportes',       '⚽', '#118ab2'),
  (8,  'Bienestar',            'bienestar',      '🧘', '#83c5be'),
  (9,  'Tours',                'tours',          '🗺️', '#e9c46a'),
  (10, 'Vida Nocturna',        'nightlife',      '🌙', '#7209b7')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. EVENTS - Insert 36 events across all cities and categories
--    Each event gets a real Unsplash image, gallery, and some get video_url
-- ══════════════════════════════════════════════════════════════════════════════

-- Helper: delete existing events to avoid slug conflicts, then re-insert
-- (This is a seed file; safe to replace all demo data)
DELETE FROM events WHERE slug IN (
  -- Madrid
  'concierto-flamenco-tablao-madrid',
  'museo-del-prado-visita-guiada',
  'mercado-de-san-miguel-tour-gastronomico',
  'teatro-real-la-traviata',
  'noche-electronica-fabrik-madrid',
  'retiro-yoga-al-amanecer',
  -- Barcelona
  'festival-primavera-sound-2026',
  'sagrada-familia-experiencia-inmersiva',
  'taller-paella-barceloneta',
  'fc-barcelona-camp-nou-experience',
  'flamenco-en-el-palau-de-la-musica',
  'tour-gotico-nocturno-barcelona',
  -- New York
  'broadway-hamilton-nyc',
  'met-museum-after-hours',
  'nyc-rooftop-jazz-night',
  'central-park-yoga-sunrise',
  'brooklyn-food-hall-tour',
  'nyc-comedy-cellar-standup',
  -- London
  'west-end-phantom-of-the-opera',
  'tate-modern-immersive-exhibit',
  'borough-market-walking-tour',
  'wimbledon-summer-tennis',
  'camden-live-music-night',
  'thames-sunset-cruise',
  -- Paris
  'moulin-rouge-cabaret-paris',
  'louvre-nocturne-visite-guidee',
  'degustation-fromages-marais',
  'festival-electronik-paris',
  'seine-river-dinner-cruise',
  'montmartre-art-walk',
  -- CDMX
  'concierto-cafe-tacvba-cdmx',
  'frida-kahlo-museo-inmersivo',
  'tour-tacos-al-pastor-cdmx',
  'lucha-libre-arena-mexico',
  'festival-corona-capital-2026',
  'xochimilco-trajineras-nocturnas'
);

-- ── Madrid Events ──────────────────────────────────────────────────────────

INSERT INTO events (title, slug, description, short_description, image, gallery, video_url, price, original_price, currency, date, end_date, time, duration, address, lat, lng, city_id, category_id, organizer_id, status, featured, capacity, sold_count, rating, review_count) VALUES
(
  'Concierto Flamenco en Tablao Madrid',
  'concierto-flamenco-tablao-madrid',
  'Vive la pasion del flamenco en uno de los tablaos mas autenticos de Madrid. Artistas de primer nivel interpretan cante, baile y guitarra en un espacio intimo con capacidad limitada. Incluye copa de vino o sangria. Una experiencia que te transportara al corazon del arte flamenco.',
  'Flamenco autentico en el corazon de Madrid con copa incluida',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2024/03/06/203069-920024913_large.mp4',
  35, 50, 'EUR', '2026-04-15', NULL, '21:00', '1h 30min',
  'Tablao Flamenco 1911, Calle del Arenal 11, Madrid', 40.4168, -3.7038,
  1, 1, 1, 'PUBLISHED', true, 120, 87, 4.8, 42
),
(
  'Museo del Prado: Visita Guiada Exclusiva',
  'museo-del-prado-visita-guiada',
  'Recorre las obras maestras del Museo del Prado con un guia experto en historia del arte. Descubre los secretos de Velazquez, Goya y El Bosco en un tour de 2 horas por las salas mas emblematicas. Grupos reducidos para una experiencia personalizada.',
  'Tour exclusivo por las obras maestras del Prado',
  'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop"]',
  NULL,
  25, NULL, 'EUR', '2026-04-20', NULL, '10:00', '2h',
  'Museo del Prado, Calle de Ruiz de Alarcon 23, Madrid', 40.4138, -3.6921,
  1, 2, 1, 'PUBLISHED', false, 20, 15, 4.9, 28
),
(
  'Mercado de San Miguel: Tour Gastronomico',
  'mercado-de-san-miguel-tour-gastronomico',
  'Saborea lo mejor de la gastronomia espanola en el iconico Mercado de San Miguel. Degustacion de jamon iberico, quesos manchegos, vinos de Rioja, tapas creativas y postres artesanales. Un recorrido culinario guiado por un sommelier certificado.',
  'Degustacion de tapas y vinos en el mercado mas famoso de Madrid',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2021/10/11/91490-632340698_large.mp4',
  45, 60, 'EUR', '2026-04-22', NULL, '12:00', '2h 30min',
  'Mercado de San Miguel, Plaza de San Miguel s/n, Madrid', 40.4153, -3.7090,
  1, 3, 1, 'PUBLISHED', true, 16, 14, 4.7, 35
),
(
  'Teatro Real: La Traviata',
  'teatro-real-la-traviata',
  'Disfruta de La Traviata de Verdi en el majestuoso Teatro Real de Madrid. Una produccion espectacular con un elenco internacional de primer nivel, orquesta en vivo y una puesta en escena que reinterpreta este clasico de la opera con una vision contemporanea.',
  'Opera clasica en el Teatro Real con elenco internacional',
  'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2020/05/16/38613-422400327_large.mp4',
  75, 120, 'EUR', '2026-05-10', NULL, '20:00', '2h 45min',
  'Teatro Real, Plaza de Isabel II s/n, Madrid', 40.4180, -3.7101,
  1, 4, 1, 'PUBLISHED', true, 1700, 1420, 4.9, 56
),
(
  'Noche Electronica en Fabrik Madrid',
  'noche-electronica-fabrik-madrid',
  'La mejor musica electronica en uno de los clubs mas grandes de Europa. Line-up de DJs internacionales, sistema de sonido Funktion-One, shows de luces laser y ambiente inigualable. Dress code: casual elegante.',
  'Musica electronica en el legendario Fabrik',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2020/07/30/45748-445655646_large.mp4',
  30, NULL, 'EUR', '2026-04-18', NULL, '23:30', '6h',
  'Fabrik Madrid, Avda. de la Industria 82, Humanes de Madrid', 40.2573, -3.8234,
  1, 10, 1, 'PUBLISHED', false, 4000, 2800, 4.5, 89
),
(
  'Retiro: Yoga al Amanecer',
  'retiro-yoga-al-amanecer',
  'Comienza tu dia con una sesion de yoga al aire libre en el Parque del Retiro. Clase apta para todos los niveles, rodeado de naturaleza en el corazon de Madrid. Incluye esterilla y botella de agua. Instructor certificado.',
  'Yoga al aire libre en el Parque del Retiro',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=500&fit=crop"]',
  NULL,
  0, NULL, 'EUR', '2026-04-12', '2026-09-30', '07:00', '1h 15min',
  'Parque del Retiro, Puerta de Alcala, Madrid', 40.4153, -3.6845,
  1, 8, 1, 'PUBLISHED', false, 30, 22, 4.6, 18
),

-- ── Barcelona Events ───────────────────────────────────────────────────────

(
  'Festival Primavera Sound 2026',
  'festival-primavera-sound-2026',
  'El festival de musica mas importante del Mediterraneo regresa con un cartel espectacular. Mas de 200 artistas en 4 dias de musica indie, electronica, hip-hop y experimental. Escenarios al aire libre con vistas al mar.',
  'El festival de referencia en Barcelona con artistas internacionales',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2023/06/14/167495-836082586_large.mp4',
  195, 250, 'EUR', '2026-06-04', '2026-06-07', '16:00', '4 dias',
  'Parc del Forum, Ronda del Litoral 34, Barcelona', 41.4109, 2.2208,
  2, 5, 1, 'PUBLISHED', true, 60000, 45000, 4.7, 312
),
(
  'Sagrada Familia: Experiencia Inmersiva',
  'sagrada-familia-experiencia-inmersiva',
  'Descubre la Sagrada Familia como nunca antes con esta experiencia inmersiva de luz y sonido. Proyecciones 360 grados sobre las columnas de Gaudi, musica envolvente y realidad aumentada. Una forma unica de entender la obra maestra modernista.',
  'Luz, sonido y realidad aumentada en la Sagrada Familia',
  'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1564149504298-00c351fd7f16?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4',
  40, 55, 'EUR', '2026-05-01', '2026-08-31', '20:30', '1h 15min',
  'Basilica de la Sagrada Familia, Carrer de Mallorca 401, Barcelona', 41.4036, 2.1744,
  2, 6, 1, 'PUBLISHED', true, 200, 180, 4.8, 95
),
(
  'Taller de Paella en La Barceloneta',
  'taller-paella-barceloneta',
  'Aprende a cocinar una autentica paella valenciana frente al mar. Un chef local te guia paso a paso: desde el sofrito hasta el socarrat perfecto. Incluye ingredientes, delantal, copa de cava y por supuesto, te comes tu creacion.',
  'Cocina paella frente al mar con un chef local',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&h=500&fit=crop"]',
  NULL,
  55, 70, 'EUR', '2026-04-25', NULL, '11:00', '3h',
  'La Mar Salada, Passeig Joan de Borbo 58, Barcelona', 41.3768, 2.1870,
  2, 3, 1, 'PUBLISHED', false, 12, 10, 4.9, 22
),
(
  'FC Barcelona: Camp Nou Experience',
  'fc-barcelona-camp-nou-experience',
  'Vive la emocion del futbol en el renovado Camp Nou. Tour por los vestuarios, sala de prensa, acceso al terreno de juego y museo interactivo con los trofeos del club. Una experiencia imprescindible para fans del deporte.',
  'Visita el estadio mas grande de Europa y su museo',
  'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop"]',
  NULL,
  35, NULL, 'EUR', '2026-04-28', NULL, '10:00', '2h',
  'Spotify Camp Nou, Carrer dAristides Maillol s/n, Barcelona', 41.3809, 2.1228,
  2, 7, 1, 'PUBLISHED', false, 500, 380, 4.6, 145
),
(
  'Flamenco en el Palau de la Musica',
  'flamenco-en-el-palau-de-la-musica',
  'Espectaculo de flamenco en el incomparable Palau de la Musica Catalana, Patrimonio de la Humanidad. Artistas de Andalucia interpretan las formas mas puras del cante jondo en un marco arquitectonico modernista unico en el mundo.',
  'Flamenco puro en un escenario Patrimonio de la Humanidad',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=500&fit=crop"]',
  NULL,
  42, NULL, 'EUR', '2026-05-03', NULL, '21:30', '1h 30min',
  'Palau de la Musica Catalana, Carrer Palau de la Musica 4-6, Barcelona', 41.3875, 2.1753,
  2, 1, 1, 'PUBLISHED', false, 500, 320, 4.7, 67
),
(
  'Tour Gotico Nocturno',
  'tour-gotico-nocturno-barcelona',
  'Recorre el Barrio Gotico de Barcelona al caer la noche. Leyendas medievales, historia oculta y rincones secretos iluminados por farolas. Un guia teatralizado te lleva por callejones centenarios hasta la Catedral. Incluye copa de vino al finalizar.',
  'Leyendas y misterios en el Barrio Gotico de noche',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=500&fit=crop"]',
  NULL,
  18, 25, 'EUR', '2026-04-19', NULL, '21:00', '2h',
  'Plaza del Rey, Barrio Gotico, Barcelona', 41.3843, 2.1770,
  2, 9, 1, 'PUBLISHED', false, 20, 16, 4.8, 31
),

-- ── New York Events ────────────────────────────────────────────────────────

(
  'Broadway: Hamilton',
  'broadway-hamilton-nyc',
  'Experience the Tony Award-winning musical Hamilton on Broadway. The revolutionary story of America''s founding father told through hip-hop, R&B, and soul music. A cultural phenomenon that has captivated audiences worldwide since 2015.',
  'The groundbreaking musical at the Richard Rodgers Theatre',
  'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=500&fit=crop"]',
  NULL,
  199, 299, 'USD', '2026-05-15', NULL, '20:00', '2h 45min',
  'Richard Rodgers Theatre, 226 W 46th St, New York', 40.7590, -73.9845,
  3, 4, 1, 'PUBLISHED', true, 1319, 1200, 4.9, 523
),
(
  'The Met: After Hours Private Tour',
  'met-museum-after-hours',
  'Explore the Metropolitan Museum of Art after closing time. A private curator-led tour through Egyptian temples, European masters, and contemporary galleries. Champagne reception in the Great Hall. Limited to 25 guests for an intimate experience.',
  'Exclusive after-hours tour of the Met with champagne',
  'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4',
  85, 120, 'USD', '2026-05-22', NULL, '19:00', '2h 30min',
  'The Metropolitan Museum of Art, 1000 5th Ave, New York', 40.7794, -73.9632,
  3, 2, 1, 'PUBLISHED', true, 25, 23, 4.9, 18
),
(
  'NYC Rooftop Jazz Night',
  'nyc-rooftop-jazz-night',
  'Live jazz on a Manhattan rooftop with panoramic views of the Empire State Building and the city skyline. Three-piece jazz ensemble playing standards and originals. Two craft cocktails included. Smart casual dress code.',
  'Live jazz and cocktails with skyline views',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop"]',
  NULL,
  65, NULL, 'USD', '2026-05-08', NULL, '20:30', '3h',
  'Rooftop 230 Fifth, 230 5th Ave, New York', 40.7440, -73.9880,
  3, 1, 1, 'PUBLISHED', false, 100, 72, 4.7, 34
),
(
  'Central Park Sunrise Yoga',
  'central-park-yoga-sunrise',
  'Start your morning with a rejuvenating yoga session in Central Park''s Sheep Meadow. All levels welcome. Certified instructor guides you through Vinyasa flow as the sun rises over the Manhattan skyline. Mat and water bottle provided.',
  'Morning yoga in Central Park with skyline views',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2019/08/12/26253-354285455_large.mp4',
  0, NULL, 'USD', '2026-04-15', '2026-09-30', '06:30', '1h',
  'Sheep Meadow, Central Park, New York', 40.7694, -73.9750,
  3, 8, 1, 'PUBLISHED', false, 50, 38, 4.6, 25
),
(
  'Brooklyn Food Hall Tour',
  'brooklyn-food-hall-tour',
  'Explore Brooklyn''s vibrant food scene with a guided tour through DeKalb Market Hall and Smorgasburg. Taste artisanal pizza, ramen, tacos, craft beer and more. Learn about Brooklyn''s immigrant food traditions and the modern culinary renaissance.',
  'Taste the best of Brooklyn in one unforgettable tour',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop"]',
  NULL,
  55, NULL, 'USD', '2026-05-03', NULL, '11:00', '3h',
  'DeKalb Market Hall, 445 Albee Square W, Brooklyn, NY', 40.6901, -73.9827,
  3, 3, 1, 'PUBLISHED', false, 15, 12, 4.8, 19
),
(
  'NYC Comedy Cellar: Stand-Up Night',
  'nyc-comedy-cellar-standup',
  'Laugh the night away at the legendary Comedy Cellar in Greenwich Village. The same stage that launched Chris Rock, Amy Schumer, and Dave Chappelle. Multiple comedians perform surprise sets. Two-drink minimum.',
  'Stand-up comedy at NYC''s most legendary comedy club',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=500&fit=crop"]',
  NULL,
  25, NULL, 'USD', '2026-05-10', NULL, '21:00', '2h',
  'Comedy Cellar, 117 MacDougal St, New York', 40.7299, -74.0007,
  3, 10, 1, 'PUBLISHED', false, 115, 95, 4.8, 156
),

-- ── London Events ──────────────────────────────────────────────────────────

(
  'West End: Phantom of the Opera',
  'west-end-phantom-of-the-opera',
  'Andrew Lloyd Webber''s masterpiece returns to the West End. Spectacular staging, iconic music, and a cast that brings the haunting love story to life beneath the Paris Opera House. The longest-running West End musical.',
  'The legendary musical at Her Majesty''s Theatre',
  'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2020/05/16/38613-422400327_large.mp4',
  85, 130, 'GBP', '2026-05-20', NULL, '19:30', '2h 30min',
  'Her Majestys Theatre, Haymarket, London', 51.5094, -0.1312,
  4, 4, 1, 'PUBLISHED', true, 1200, 980, 4.8, 234
),
(
  'Tate Modern: Immersive Light Exhibit',
  'tate-modern-immersive-exhibit',
  'Step into a world of light and color at the Tate Modern''s Turbine Hall. This immersive installation transforms the massive industrial space into a living canvas of projected light, responsive sound, and interactive elements that react to your movement.',
  'Walk through light and sound at the Tate Modern',
  'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1564149504298-00c351fd7f16?w=800&h=500&fit=crop"]',
  NULL,
  22, NULL, 'GBP', '2026-05-05', '2026-08-31', '10:00', '1h 30min',
  'Tate Modern, Bankside, London SE1 9TG', 51.5076, -0.0994,
  4, 6, 1, 'PUBLISHED', true, 300, 245, 4.7, 89
),
(
  'Borough Market Walking Food Tour',
  'borough-market-walking-tour',
  'Discover London''s oldest food market with a local food writer. Sample artisanal cheeses, fresh oysters, sourdough bread, Ethiopian injera, and British pies. Learn the 1000-year history of Borough Market and meet the traders behind the stalls.',
  'Taste your way through London''s legendary food market',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop"]',
  NULL,
  45, 60, 'GBP', '2026-05-12', NULL, '10:30', '2h 30min',
  'Borough Market, 8 Southwark St, London SE1 1TL', 51.5055, -0.0910,
  4, 3, 1, 'PUBLISHED', false, 14, 12, 4.9, 41
),
(
  'Wimbledon Summer Tennis Experience',
  'wimbledon-summer-tennis',
  'Watch world-class tennis at the All England Lawn Tennis Club during the Wimbledon Championships. Centre Court tickets with reserved seating, access to the grounds, and traditional strawberries and cream. A quintessential British summer experience.',
  'Centre Court tickets at the Wimbledon Championships',
  'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&h=500&fit=crop"]',
  NULL,
  175, 250, 'GBP', '2026-06-29', '2026-07-12', '11:00', '8h',
  'All England Lawn Tennis Club, Church Rd, Wimbledon, London SW19 5AE', 51.4341, -0.2143,
  4, 7, 1, 'PUBLISHED', true, 14979, 14500, 4.9, 678
),
(
  'Camden Live Music Night',
  'camden-live-music-night',
  'Experience London''s legendary live music scene in Camden Town. Three bands perform at the iconic Roundhouse venue, from indie rock to experimental electronic. Standing-room with bars on every level. The heartbeat of London''s alternative music culture.',
  'Indie and electronic live sets at the Roundhouse',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop"]',
  NULL,
  28, NULL, 'GBP', '2026-05-08', NULL, '19:30', '4h',
  'Roundhouse, Chalk Farm Rd, London NW1 8EH', 51.5434, -0.1521,
  4, 1, 1, 'PUBLISHED', false, 1700, 1100, 4.6, 87
),
(
  'Thames Sunset Cruise',
  'thames-sunset-cruise',
  'Cruise along the River Thames at golden hour. Pass the Houses of Parliament, Tower Bridge, the Shard, and Greenwich. Includes a glass of prosecco and live commentary. The most beautiful way to see London''s iconic landmarks.',
  'Prosecco cruise past London''s most iconic landmarks',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2021/01/03/60976-498063967_large.mp4',
  38, NULL, 'GBP', '2026-05-16', NULL, '18:30', '2h',
  'Westminster Pier, Victoria Embankment, London SW1A 2JH', 51.5014, -0.1247,
  4, 9, 1, 'PUBLISHED', false, 80, 65, 4.8, 52
),

-- ── Paris Events ───────────────────────────────────────────────────────────

(
  'Moulin Rouge: Le Grand Cabaret',
  'moulin-rouge-cabaret-paris',
  'Le spectacle le plus celebre du monde au Moulin Rouge. Danseurs, acrobates, costumes somptueux et le fameux French Cancan. Demi-bouteille de champagne incluse. Un show eblouissant depuis 1889.',
  'Le cabaret mythique avec champagne et French Cancan',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=500&fit=crop"]',
  NULL,
  115, 150, 'EUR', '2026-05-25', NULL, '21:00', '2h',
  'Moulin Rouge, 82 Boulevard de Clichy, 75018 Paris', 48.8841, 2.3322,
  5, 10, 1, 'PUBLISHED', true, 850, 780, 4.7, 289
),
(
  'Louvre Nocturne: Visite Guidee',
  'louvre-nocturne-visite-guidee',
  'Decouvrez le Louvre le soir, loin de la foule. Un guide-conferencier vous mene de la Victoire de Samothrace a la Joconde, en passant par les appartements de Napoleon III. Ambiance feutree et eclairage magique.',
  'Le Louvre sans la foule: visite nocturne exclusive',
  'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1499426600726-ac2c83e6f90d?w=800&h=500&fit=crop"]',
  NULL,
  30, 45, 'EUR', '2026-05-18', NULL, '19:00', '2h',
  'Musee du Louvre, Rue de Rivoli, 75001 Paris', 48.8606, 2.3376,
  5, 2, 1, 'PUBLISHED', true, 30, 28, 4.9, 67
),
(
  'Degustation de Fromages dans le Marais',
  'degustation-fromages-marais',
  'Un maitre fromager vous guide a travers les meilleurs fromages de France. De l''Epoisses au Comte 36 mois, en passant par le Roquefort et le Brie de Meaux. Accords avec vins naturels et pain au levain. Dans une cave voutee du Marais.',
  'Fromages d''exception et vins naturels dans le Marais',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2021/10/11/91490-632340698_large.mp4',
  50, NULL, 'EUR', '2026-05-10', NULL, '18:00', '2h',
  'Cave a Fromages, 41 Rue du Temple, 75004 Paris', 48.8596, 2.3552,
  5, 3, 1, 'PUBLISHED', false, 16, 14, 4.8, 23
),
(
  'Festival Electronik Paris',
  'festival-electronik-paris',
  'Trois jours de musique electronique dans les plus beaux lieux de Paris. Du Palais de Tokyo aux Docks de la Seine, les meilleurs DJs de la scene techno et house europeenne. Light shows immersifs et food trucks.',
  'Techno et house dans les lieux iconiques de Paris',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop"]',
  NULL,
  85, 120, 'EUR', '2026-06-20', '2026-06-22', '18:00', '3 jours',
  'Palais de Tokyo, 13 Avenue du President Wilson, 75116 Paris', 48.8638, 2.2971,
  5, 5, 1, 'PUBLISHED', false, 5000, 3200, 4.5, 156
),
(
  'Croisiere Diner sur la Seine',
  'seine-river-dinner-cruise',
  'Dinez en croisant devant la Tour Eiffel illuminee, Notre-Dame et le Musee d''Orsay. Menu gastronomique 4 plats avec vins selectionnes. Musique live et terrasse panoramique. L''experience parisienne ultime.',
  'Diner gastronomique en croisiere face a la Tour Eiffel',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&h=500&fit=crop"]',
  NULL,
  120, 160, 'EUR', '2026-05-28', NULL, '20:00', '2h 30min',
  'Port de la Bourdonnais, 75007 Paris', 48.8584, 2.2945,
  5, 9, 1, 'PUBLISHED', true, 120, 105, 4.8, 78
),
(
  'Montmartre Art Walk',
  'montmartre-art-walk',
  'Suivez les pas de Picasso, Modigliani et Toulouse-Lautrec dans les ruelles de Montmartre. Visite d''ateliers d''artistes contemporains, du Bateau-Lavoir a la Place du Tertre. Finissez avec un verre de vin au Lapin Agile.',
  'Marche artistique sur les traces des grands maitres',
  'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1499426600726-ac2c83e6f90d?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop"]',
  NULL,
  0, NULL, 'EUR', '2026-04-20', '2026-10-31', '14:00', '2h 30min',
  'Place du Tertre, 75018 Paris', 48.8865, 2.3411,
  5, 2, 1, 'PUBLISHED', false, 20, 15, 4.7, 32
),

-- ── CDMX Events ────────────────────────────────────────────────────────────

(
  'Concierto Cafe Tacvba en el Zocalo',
  'concierto-cafe-tacvba-cdmx',
  'Cafe Tacvba regresa al Zocalo de la Ciudad de Mexico con un concierto gratuito epico. Mas de 25 anos de rock mexicano en el corazon del pais. Canciones clasicas y nuevas. Pantallas gigantes y sonido de primer nivel. Un evento historico.',
  'Rock mexicano legendario gratis en el Zocalo',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2024/03/06/203069-920024913_large.mp4',
  0, NULL, 'MXN', '2026-05-01', NULL, '19:00', '3h',
  'Zocalo de la Ciudad de Mexico, Plaza de la Constitucion s/n, Centro Historico', 19.4326, -99.1332,
  6, 1, 1, 'PUBLISHED', true, 100000, 85000, 4.8, 1240
),
(
  'Frida Kahlo: Museo Inmersivo',
  'frida-kahlo-museo-inmersivo',
  'Sumérgete en el universo de Frida Kahlo a traves de proyecciones inmersivas, aromas florales y musica mexicana. Recorre las etapas de su vida desde la Casa Azul hasta sus obras mas iconicas. Tecnologia de punta en un espacio de 2,000 m2.',
  'Experiencia inmersiva 360 grados dedicada a Frida Kahlo',
  'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1564149504298-00c351fd7f16?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4',
  350, 450, 'MXN', '2026-04-15', '2026-07-31', '10:00', '1h 30min',
  'Frontón Mexico, Plaza de la Republica 17, Tabacalera, CDMX', 19.4362, -99.1544,
  6, 6, 1, 'PUBLISHED', true, 250, 220, 4.9, 189
),
(
  'Tour de Tacos al Pastor por la CDMX',
  'tour-tacos-al-pastor-cdmx',
  'El tour definitivo de tacos al pastor. Visita 5 taquerias legendarias en colonias Roma, Condesa y Centro. Aprende la historia del trompo de pastor, desde su origen libanes hasta la perfeccion mexicana. Incluye agua de horchata y postre.',
  'Recorrido por las mejores taquerias de pastor de la ciudad',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop"]',
  NULL,
  450, 600, 'MXN', '2026-04-20', NULL, '18:00', '3h',
  'Punto de encuentro: Metro Insurgentes, CDMX', 19.4215, -99.1642,
  6, 3, 1, 'PUBLISHED', false, 12, 10, 4.9, 56
),
(
  'Lucha Libre en la Arena Mexico',
  'lucha-libre-arena-mexico',
  'Vive la emocion de la lucha libre mexicana en la catedral del pancracio. Mascaras, llaves, plancha y mucha adrenalina. La experiencia mas autentica del deporte-espectaculo mexicano. Funcion de viernes con las principales figuras del CMLL.',
  'La catedral de la lucha libre te espera cada viernes',
  'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop"]',
  NULL,
  180, NULL, 'MXN', '2026-04-17', NULL, '20:30', '3h',
  'Arena Mexico, Dr. Lavista 197, Doctores, CDMX', 19.4244, -99.1470,
  6, 7, 1, 'PUBLISHED', false, 16500, 12000, 4.7, 234
),
(
  'Festival Corona Capital 2026',
  'festival-corona-capital-2026',
  'El festival de musica mas grande de Mexico regresa a la Curva 4 del Autodromo Hermanos Rodriguez. Dos dias de rock alternativo, indie, electronica y hip-hop con artistas internacionales y lo mejor de la escena mexicana. Food trucks y areas VIP.',
  'El festival que define la musica en Mexico',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop"]',
  'https://cdn.pixabay.com/video/2023/06/14/167495-836082586_large.mp4',
  2800, 3500, 'MXN', '2026-11-14', '2026-11-15', '13:00', '2 dias',
  'Autodromo Hermanos Rodriguez, Curva 4, Granjas Mexico, CDMX', 19.4042, -99.0907,
  6, 5, 1, 'PUBLISHED', true, 85000, 62000, 4.6, 890
),
(
  'Xochimilco: Trajineras Nocturnas',
  'xochimilco-trajineras-nocturnas',
  'Navega por los canales prehispanicos de Xochimilco bajo la luz de la luna y velas flotantes. Musica de mariachi en vivo, pulque artesanal y antojitos mexicanos a bordo de una trajinera decorada con flores. Patrimonio de la Humanidad por la UNESCO.',
  'Paseo nocturno en trajinera con mariachi y pulque',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  '["https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&h=500&fit=crop"]',
  NULL,
  250, 350, 'MXN', '2026-04-26', NULL, '19:00', '3h',
  'Embarcadero Nuevo Nativitas, Xochimilco, CDMX', 19.2769, -99.1029,
  6, 9, 1, 'PUBLISHED', false, 20, 16, 4.8, 47
);


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. UPDATE existing events that might already be in the database
--    (Matches by slug and updates image, video_url, gallery)
-- ══════════════════════════════════════════════════════════════════════════════

-- This section catches any events that were already inserted by another method
-- and ensures they have proper media assets. The INSERT above handles fresh DBs.

-- Madrid
UPDATE events SET
  image = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2024/03/06/203069-920024913_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop"]'
WHERE slug = 'concierto-flamenco-tablao-madrid';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop"]'
WHERE slug = 'museo-del-prado-visita-guiada';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2021/10/11/91490-632340698_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop"]'
WHERE slug = 'mercado-de-san-miguel-tour-gastronomico';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2020/05/16/38613-422400327_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop"]'
WHERE slug = 'teatro-real-la-traviata';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2020/07/30/45748-445655646_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=500&fit=crop"]'
WHERE slug = 'noche-electronica-fabrik-madrid';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=500&fit=crop"]'
WHERE slug = 'retiro-yoga-al-amanecer';

-- Barcelona
UPDATE events SET
  image = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2023/06/14/167495-836082586_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop"]'
WHERE slug = 'festival-primavera-sound-2026';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1564149504298-00c351fd7f16?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=500&fit=crop"]'
WHERE slug = 'sagrada-familia-experiencia-inmersiva';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=800&h=500&fit=crop"]'
WHERE slug = 'taller-paella-barceloneta';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop"]'
WHERE slug = 'fc-barcelona-camp-nou-experience';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=500&fit=crop"]'
WHERE slug = 'flamenco-en-el-palau-de-la-musica';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=500&fit=crop"]'
WHERE slug = 'tour-gotico-nocturno-barcelona';

-- New York
UPDATE events SET
  image = 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=500&fit=crop"]'
WHERE slug = 'broadway-hamilton-nyc';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop"]'
WHERE slug = 'met-museum-after-hours';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop"]'
WHERE slug = 'nyc-rooftop-jazz-night';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2019/08/12/26253-354285455_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=500&fit=crop"]'
WHERE slug = 'central-park-yoga-sunrise';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop"]'
WHERE slug = 'brooklyn-food-hall-tour';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&h=500&fit=crop"]'
WHERE slug = 'nyc-comedy-cellar-standup';

-- London
UPDATE events SET
  image = 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2020/05/16/38613-422400327_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&h=500&fit=crop"]'
WHERE slug = 'west-end-phantom-of-the-opera';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1564149504298-00c351fd7f16?w=800&h=500&fit=crop"]'
WHERE slug = 'tate-modern-immersive-exhibit';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop"]'
WHERE slug = 'borough-market-walking-tour';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&h=500&fit=crop"]'
WHERE slug = 'wimbledon-summer-tennis';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop"]'
WHERE slug = 'camden-live-music-night';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2021/01/03/60976-498063967_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&h=500&fit=crop"]'
WHERE slug = 'thames-sunset-cruise';

-- Paris
UPDATE events SET
  image = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1571266028243-3716f02d2d3e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=500&fit=crop"]'
WHERE slug = 'moulin-rouge-cabaret-paris';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1605034313761-73ea4a0cfbf3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1499426600726-ac2c83e6f90d?w=800&h=500&fit=crop"]'
WHERE slug = 'louvre-nocturne-visite-guidee';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2021/10/11/91490-632340698_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1452195100486-9cc805987862?w=800&h=500&fit=crop"]'
WHERE slug = 'degustation-fromages-marais';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop"]'
WHERE slug = 'festival-electronik-paris';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&h=500&fit=crop"]'
WHERE slug = 'seine-river-dinner-cruise';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1499426600726-ac2c83e6f90d?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop"]'
WHERE slug = 'montmartre-art-walk';

-- CDMX
UPDATE events SET
  image = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2024/03/06/203069-920024913_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop"]'
WHERE slug = 'concierto-cafe-tacvba-cdmx';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1564149504298-00c351fd7f16?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop"]'
WHERE slug = 'frida-kahlo-museo-inmersivo';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop"]'
WHERE slug = 'tour-tacos-al-pastor-cdmx';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&h=500&fit=crop"]'
WHERE slug = 'lucha-libre-arena-mexico';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
  video_url = 'https://cdn.pixabay.com/video/2023/06/14/167495-836082586_large.mp4',
  gallery = '["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop"]'
WHERE slug = 'festival-corona-capital-2026';

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop',
  video_url = NULL,
  gallery = '["https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&h=500&fit=crop"]'
WHERE slug = 'xochimilco-trajineras-nocturnas';


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Catch-all: update ANY event without an image to a sensible default
-- ══════════════════════════════════════════════════════════════════════════════

UPDATE events SET
  image = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop'
WHERE image IS NULL OR image = '';

UPDATE events SET
  gallery = '["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop"]'
WHERE gallery IS NULL;


-- ══════════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ══════════════════════════════════════════════════════════════════════════════
-- Cities:  6 (Madrid, Barcelona, New York, London, Paris, CDMX)
-- Categories: 10 (Conciertos, Arte, Gastronomia, Teatro, Festivales,
--                  Inmersivo, Deportes, Bienestar, Tours, Vida Nocturna)
-- Events: 36 total (6 per city)
--   - Each event has a real Unsplash image (800x500)
--   - Each event has 3-4 gallery images from Unsplash
--   - 14 events have video_url (Pixabay MP4 direct links):
--       Concerts:   concierto-flamenco-tablao-madrid, concierto-cafe-tacvba-cdmx
--       Nightlife:  noche-electronica-fabrik-madrid
--       Food:       mercado-de-san-miguel-tour-gastronomico, degustation-fromages-marais
--       Theater:    teatro-real-la-traviata, west-end-phantom-of-the-opera
--       Festivals:  festival-primavera-sound-2026, festival-corona-capital-2026
--       Immersive:  sagrada-familia-experiencia-inmersiva, frida-kahlo-museo-inmersivo
--       Art:        met-museum-after-hours
--       Wellness:   central-park-yoga-sunrise
--       Travel:     thames-sunset-cruise
-- ══════════════════════════════════════════════════════════════════════════════
