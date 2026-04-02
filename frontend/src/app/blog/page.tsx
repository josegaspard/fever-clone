import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

const BASE_URL = 'https://fever-clone.vercel.app';

export const metadata: Metadata = {
  title: 'Blog Fever - Guias, tendencias y lo mejor en eventos',
  description:
    'Descubre guias, tendencias, consejos y lo mejor del mundo de los eventos. Articulos sobre gastronomia, cultura, musica, viajes y planes en tu ciudad.',
  keywords: [
    'blog eventos',
    'guias eventos',
    'tendencias eventos',
    'que hacer en mi ciudad',
    'planes culturales',
    'gastronomia',
    'conciertos',
    'festivales',
    'tips viajes',
    'agenda cultural',
  ],
  openGraph: {
    title: 'Blog Fever - Guias, tendencias y lo mejor en eventos',
    description:
      'Descubre guias, tendencias, consejos y lo mejor del mundo de los eventos.',
    type: 'website',
    url: `${BASE_URL}/blog`,
    siteName: 'Fever',
    locale: 'es_ES',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blog Fever - Guias y tendencias en eventos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@fever',
    title: 'Blog Fever - Guias, tendencias y lo mejor en eventos',
    description:
      'Descubre guias, tendencias, consejos y lo mejor del mundo de los eventos.',
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
};

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  image: string | null;
  author_name: string;
  category: string;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  featured: boolean;
  reading_time: number;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  guias: 'Guias',
  tendencias: 'Tendencias',
  eventos: 'Eventos',
  ciudades: 'Ciudades',
  gastronomia: 'Gastronomia',
  cultura: 'Cultura',
  tips: 'Tips',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const activeCategory =
    typeof resolvedParams.category === 'string' ? resolvedParams.category : null;

  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });

  if (activeCategory) {
    query = query.eq('category', activeCategory);
  }

  const { data: posts } = await query;
  const allPosts: BlogPost[] = (posts || []) as BlogPost[];

  // Get all categories from posts for filter pills
  const { data: allPublished } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('status', 'PUBLISHED');
  const categories = Array.from(
    new Set((allPublished || []).map((p: { category: string }) => p.category))
  );

  // Featured post
  const featuredPost = allPosts.find((p) => p.featured) || allPosts[0] || null;
  const gridPosts = allPosts.filter((p) => p.id !== featuredPost?.id);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Fever',
    description:
      'Guias, tendencias y lo mejor en eventos. Articulos sobre gastronomia, cultura, musica y planes en tu ciudad.',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Fever',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-image.png`,
      },
    },
    blogPost: allPosts.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.created_at,
      dateModified: post.updated_at,
      author: {
        '@type': 'Person',
        name: post.author_name,
      },
      ...(post.image && { image: post.image }),
      ...(post.excerpt && { description: post.excerpt }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="animate-fade-in">
        {/* Hero */}
        <section
          className="border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight mb-4"
              style={{ color: 'var(--fg)' }}
            >
              Blog <span className="gradient-text">Fever</span>
            </h1>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Guias, tendencias y lo mejor en eventos
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Category filter pills */}
          {categories.length > 1 && (
            <nav className="flex flex-wrap gap-2 mb-10" aria-label="Filtrar por categoria">
              <Link
                href="/blog"
                className="px-4 py-2 rounded-full text-sm font-medium border transition"
                style={{
                  background: !activeCategory ? '#e63946' : 'var(--card)',
                  color: !activeCategory ? '#fff' : 'var(--text-secondary)',
                  borderColor: !activeCategory ? '#e63946' : 'var(--border)',
                }}
              >
                Todos
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?category=${cat}`}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition"
                  style={{
                    background: activeCategory === cat ? '#e63946' : 'var(--card)',
                    color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                    borderColor: activeCategory === cat ? '#e63946' : 'var(--border)',
                  }}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </Link>
              ))}
            </nav>
          )}

          {/* Featured post */}
          {featuredPost && !activeCategory && (
            <article className="mb-12">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block rounded-2xl overflow-hidden border transition hover:shadow-lg"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[360px]">
                    {featuredPost.image ? (
                      <Image
                        src={featuredPost.image}
                        alt={featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <svg
                          className="w-16 h-16"
                          style={{ color: 'var(--text-tertiary)' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946' }}
                      >
                        {CATEGORY_LABELS[featuredPost.category] || featuredPost.category}
                      </span>
                      {featuredPost.featured && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'rgba(234,179,8,0.12)',
                            color: '#ca8a04',
                          }}
                        >
                          Destacado
                        </span>
                      )}
                    </div>
                    <h2
                      className="text-2xl md:text-3xl font-black tracking-tight mb-3 group-hover:text-[#e63946] transition"
                      style={{ color: 'var(--fg)' }}
                    >
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p
                        className="text-base mb-6 line-clamp-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-4 text-sm"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <span>{featuredPost.author_name}</span>
                      <span aria-hidden="true">-</span>
                      <time dateTime={featuredPost.created_at}>
                        {formatDate(featuredPost.created_at)}
                      </time>
                      <span aria-hidden="true">-</span>
                      <span>{featuredPost.reading_time} min de lectura</span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          )}

          {/* Posts grid */}
          {gridPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <article key={post.id}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block rounded-2xl overflow-hidden border transition hover:shadow-lg h-full"
                    style={{
                      background: 'var(--card)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div className="relative aspect-[16/10]">
                      {post.image ? (
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: 'var(--surface-2)' }}
                        >
                          <svg
                            className="w-10 h-10"
                            style={{ color: 'var(--text-tertiary)' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
                          style={{
                            background: 'rgba(230,57,70,0.9)',
                            color: '#fff',
                          }}
                        >
                          {CATEGORY_LABELS[post.category] || post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3
                        className="text-lg font-bold tracking-tight mb-2 line-clamp-2 group-hover:text-[#e63946] transition"
                        style={{ color: 'var(--fg)' }}
                      >
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p
                          className="text-sm mb-4 line-clamp-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {post.excerpt}
                        </p>
                      )}
                      <div
                        className="flex items-center justify-between text-xs"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span>{post.author_name}</span>
                          <span aria-hidden="true">-</span>
                          <time dateTime={post.created_at}>
                            {formatDate(post.created_at)}
                          </time>
                        </div>
                        <span>{post.reading_time} min</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--fg)' }}
              >
                No hay articulos todavia
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Pronto publicaremos contenido increible. Vuelve pronto.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
