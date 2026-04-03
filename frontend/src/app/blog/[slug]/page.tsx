import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ShareButton from '@/components/ShareButton';

export const revalidate = 300;

const BASE_URL = 'https://fever-clone.vercel.app';

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

// Dynamic SEO metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  if (!post) {
    return {
      title: 'Articulo no encontrado',
      description: 'Este articulo no existe o ya no esta disponible.',
    };
  }

  const title = post.meta_title || post.title;
  const description =
    post.meta_description || post.excerpt || post.content.slice(0, 160);
  const postUrl = `${BASE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: [
      post.category,
      ...(post.tags || []),
      'blog',
      'eventos',
      'CTXplorer',
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      url: postUrl,
      siteName: 'CTXplorer',
      locale: 'es_ES',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      section: post.category,
      tags: post.tags || [],
      authors: [post.author_name],
      images: post.image
        ? [
            {
              url: post.image,
              width: 1200,
              height: 630,
              alt: post.title,
              type: 'image/jpeg',
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@ctxplorer',
      creator: '@ctxplorer',
      title,
      description,
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630, alt: post.title }]
        : [],
    },
    alternates: {
      canonical: postUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  if (error || !post) {
    notFound();
  }

  const typedPost = post as BlogPost;

  // Related posts (same category, exclude current)
  const { data: relatedRows } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'PUBLISHED')
    .eq('category', typedPost.category)
    .neq('id', typedPost.id)
    .order('created_at', { ascending: false })
    .limit(3);
  const relatedPosts: BlogPost[] = (relatedRows || []) as BlogPost[];

  // Previous and next posts
  const { data: prevRow } = await supabase
    .from('blog_posts')
    .select('title, slug')
    .eq('status', 'PUBLISHED')
    .lt('created_at', typedPost.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: nextRow } = await supabase
    .from('blog_posts')
    .select('title, slug')
    .eq('status', 'PUBLISHED')
    .gt('created_at', typedPost.created_at)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  const postUrl = `${BASE_URL}/blog/${typedPost.slug}`;

  // JSON-LD Article schema
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: typedPost.title,
    description: typedPost.excerpt || typedPost.content.slice(0, 160),
    url: postUrl,
    datePublished: typedPost.created_at,
    dateModified: typedPost.updated_at,
    author: {
      '@type': 'Person',
      name: typedPost.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CTXplorer',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/og-image.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    ...(typedPost.image && {
      image: {
        '@type': 'ImageObject',
        url: typedPost.image,
        width: 1200,
        height: 630,
      },
    }),
    wordCount: typedPost.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
    articleSection: typedPost.category,
    keywords: (typedPost.tags || []).join(', '),
    inLanguage: 'es',
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${BASE_URL}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: typedPost.title,
        item: postUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="animate-fade-in">
        {/* Breadcrumb */}
        <nav
          className="max-w-4xl mx-auto px-4 pt-8 pb-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <li>
              <Link href="/" className="hover:text-[#e63946] transition">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href="/blog" className="hover:text-[#e63946] transition">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li
              className="truncate max-w-[200px] md:max-w-[400px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {typedPost.title}
            </li>
          </ol>
        </nav>

        {/* Article */}
        <article className="max-w-[720px] mx-auto px-4 pb-16">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href={`/blog?category=${typedPost.category}`}
                className="px-3 py-1 rounded-full text-xs font-semibold transition hover:opacity-80"
                style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946' }}
              >
                {CATEGORY_LABELS[typedPost.category] || typedPost.category}
              </Link>
              {typedPost.featured && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(234,179,8,0.12)', color: '#ca8a04' }}
                >
                  Destacado
                </span>
              )}
            </div>

            <h1
              className="text-3xl md:text-4xl font-black tracking-tight mb-6"
              style={{ color: 'var(--fg)' }}
            >
              {typedPost.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: '#e63946' }}
                >
                  {typedPost.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--fg)' }}
                  >
                    {typedPost.author_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <time dateTime={typedPost.created_at}>
                      {formatDate(typedPost.created_at)}
                    </time>
                    {' '}&middot; {typedPost.reading_time} min de lectura
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                <ShareButton
                  title={typedPost.title}
                  url={postUrl}
                  description={typedPost.excerpt || undefined}
                />
              </div>
            </div>
          </header>

          {/* Featured image */}
          {typedPost.image && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
              <Image
                src={typedPost.image}
                alt={typedPost.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 720px"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="blog-content prose-custom"
            dangerouslySetInnerHTML={{ __html: typedPost.content }}
          />

          {/* Tags */}
          {typedPost.tags && typedPost.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Etiquetas:
                </span>
                {typedPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Share again */}
          <div
            className="mt-8 pt-6 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border)' }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Comparte este articulo
            </p>
            <ShareButton
              title={typedPost.title}
              url={postUrl}
              description={typedPost.excerpt || undefined}
            />
          </div>

          {/* Previous / Next navigation */}
          <div
            className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-4"
            style={{ borderColor: 'var(--border)' }}
          >
            {prevRow ? (
              <Link
                href={`/blog/${prevRow.slug}`}
                className="group flex flex-col p-4 rounded-xl border transition hover:border-[#e63946]/30"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <span className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Anterior
                </span>
                <span
                  className="text-sm font-semibold line-clamp-2 group-hover:text-[#e63946] transition"
                  style={{ color: 'var(--fg)' }}
                >
                  {prevRow.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {nextRow ? (
              <Link
                href={`/blog/${nextRow.slug}`}
                className="group flex flex-col p-4 rounded-xl border transition hover:border-[#e63946]/30 text-right"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <span className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  Siguiente
                </span>
                <span
                  className="text-sm font-semibold line-clamp-2 group-hover:text-[#e63946] transition"
                  style={{ color: 'var(--fg)' }}
                >
                  {nextRow.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Back to blog */}
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#e63946] transition"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al blog
            </Link>
          </div>
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section
            className="border-t py-16"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="max-w-7xl mx-auto px-4">
              <h2
                className="text-2xl font-bold tracking-tight mb-8"
                style={{ color: 'var(--fg)' }}
              >
                Articulos relacionados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rp) => (
                  <article key={rp.id}>
                    <Link
                      href={`/blog/${rp.slug}`}
                      className="group block rounded-2xl overflow-hidden border transition hover:shadow-lg"
                      style={{
                        background: 'var(--card)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div className="relative aspect-[16/10]">
                        {rp.image ? (
                          <Image
                            src={rp.image}
                            alt={rp.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 33vw"
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
                      </div>
                      <div className="p-5">
                        <h3
                          className="text-base font-bold tracking-tight mb-2 line-clamp-2 group-hover:text-[#e63946] transition"
                          style={{ color: 'var(--fg)' }}
                        >
                          {rp.title}
                        </h3>
                        <div
                          className="text-xs"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <time dateTime={rp.created_at}>
                            {formatDate(rp.created_at)}
                          </time>
                          {' '}&middot; {rp.reading_time} min
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Blog content styles */}
      <style>{`
        .blog-content {
          font-size: 1.0625rem;
          line-height: 1.8;
          color: var(--text-secondary);
        }
        .blog-content h1,
        .blog-content h2,
        .blog-content h3,
        .blog-content h4,
        .blog-content h5,
        .blog-content h6 {
          color: var(--fg);
          font-weight: 800;
          margin-top: 2em;
          margin-bottom: 0.75em;
          letter-spacing: -0.02em;
        }
        .blog-content h2 { font-size: 1.5rem; }
        .blog-content h3 { font-size: 1.25rem; }
        .blog-content p {
          margin-bottom: 1.25em;
        }
        .blog-content a {
          color: #e63946;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .blog-content a:hover {
          opacity: 0.8;
        }
        .blog-content img {
          border-radius: 12px;
          margin: 2em 0;
          max-width: 100%;
          height: auto;
        }
        .blog-content ul,
        .blog-content ol {
          padding-left: 1.5em;
          margin-bottom: 1.25em;
        }
        .blog-content li {
          margin-bottom: 0.5em;
        }
        .blog-content blockquote {
          border-left: 4px solid #e63946;
          padding: 1em 1.5em;
          margin: 1.5em 0;
          background: var(--surface-2);
          border-radius: 0 12px 12px 0;
          font-style: italic;
        }
        .blog-content pre {
          background: var(--surface-2);
          padding: 1.25em;
          border-radius: 12px;
          overflow-x: auto;
          margin: 1.5em 0;
          font-size: 0.875rem;
        }
        .blog-content code {
          background: var(--surface-2);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
        }
        .blog-content pre code {
          background: none;
          padding: 0;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 2em 0;
        }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        .blog-content th,
        .blog-content td {
          border: 1px solid var(--border);
          padding: 0.75em 1em;
          text-align: left;
        }
        .blog-content th {
          background: var(--surface-2);
          font-weight: 700;
          color: var(--fg);
        }
      `}</style>
    </>
  );
}
