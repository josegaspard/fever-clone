-- Venues/Organizer Profiles
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  logo TEXT,
  cover_image TEXT,
  category TEXT DEFAULT 'general',
  address TEXT,
  city_id INT REFERENCES cities(id),
  lat FLOAT,
  lng FLOAT,
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  twitter TEXT,
  facebook TEXT,
  tiktok TEXT,
  rating FLOAT DEFAULT 0,
  review_count INT DEFAULT 0,
  follower_count INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city_id);

-- Link events to venues
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id INT REFERENCES venues(id);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);

-- Follows table
CREATE TABLE IF NOT EXISTS venue_follows (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  venue_id INT NOT NULL,
  notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);

-- Seed: Museo Franz Mayer
INSERT INTO venues (slug, name, description, short_description, logo, cover_image, category, address, lat, lng, phone, website, instagram, verified, featured, city_id) VALUES
('museo-franz-mayer', 'Museo Franz Mayer',
'El Museo Franz Mayer es uno de los museos mas importantes de Mexico, ubicado en el Centro Historico de la Ciudad de Mexico. Alberga una de las colecciones de artes decorativas mas importantes de America Latina, con mas de 10,000 piezas que abarcan desde el siglo XVI hasta el XIX. El museo tambien cuenta con una impresionante biblioteca con mas de 14,000 volumenes y realiza exposiciones temporales de arte contemporaneo, diseno y fotografia.

Fundado en 1986 por el empresario aleman Franz Mayer, el museo se encuentra en el antiguo Hospital de San Juan de Dios, un edificio del siglo XVII con una hermosa arquitectura colonial. El claustro del museo es uno de los espacios mas fotografiados de la ciudad.

Ademas de sus exposiciones permanentes y temporales, el museo ofrece talleres, conferencias, visitas guiadas y eventos especiales que lo convierten en un centro cultural vivo y dinamico.',
'Museo de artes decorativas y diseno en el Centro Historico de CDMX. Exposiciones, talleres y eventos culturales.',
'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=200&h=200&fit=crop&q=80',
'https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=1920&h=600&fit=crop&q=80',
'museo', 'Av. Hidalgo 45, Centro Historico, 06300 CDMX', 19.4368, -99.1412,
'+52 55 5518 2266', 'https://www.franzmayer.org.mx', '@museosfranzmayer', true, true,
(SELECT id FROM cities WHERE slug = 'cdmx' LIMIT 1))
ON CONFLICT (slug) DO NOTHING;
