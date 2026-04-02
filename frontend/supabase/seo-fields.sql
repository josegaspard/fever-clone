-- SEO fields for events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS meta_keywords TEXT[];

-- SEO settings table for global site configuration
CREATE TABLE IF NOT EXISTS seo_settings (
  id SERIAL PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE, -- 'home', 'search', 'build-day', 'category:conciertos', etc.
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image TEXT,
  custom_schema_json TEXT, -- Additional JSON-LD schema
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default SEO settings
INSERT INTO seo_settings (page_key, meta_title, meta_description) VALUES
  ('home', 'Fever - Descubre los mejores planes y eventos en tu ciudad', 'Explora conciertos, gastronomia, arte, festivales y mas. Crea tu Day perfecto en Ciudad de Mexico, Madrid, Barcelona, New York, London y Paris.'),
  ('search', 'Buscar eventos y experiencias | Fever', 'Encuentra eventos, conciertos, teatro, gastronomia y experiencias unicas en tu ciudad. Filtra por precio, fecha y categoria.'),
  ('build-day', 'Arma tu Day perfecto | Fever', 'Crea itinerarios personalizados con los mejores eventos. Rutas optimizadas, presupuesto ajustado y recomendaciones inteligentes.'),
  ('blog', 'Blog Fever - Guias, tendencias y eventos', 'Lee nuestras guias sobre los mejores eventos, tendencias culturales y recomendaciones en tu ciudad.')
ON CONFLICT (page_key) DO NOTHING;

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  image TEXT,
  author_name TEXT DEFAULT 'Fever Team',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
  featured BOOLEAN DEFAULT FALSE,
  reading_time INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Password reset tokens (if not created yet)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
