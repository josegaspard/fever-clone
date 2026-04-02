'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface VenueCardProps {
  venue: {
    slug: string;
    name: string;
    shortDescription?: string;
    logo?: string;
    category?: string;
    followerCount?: number;
    verified?: boolean;
    eventsCount?: number;
  };
}

const categoryLabels: Record<string, string> = {
  museo: 'Museo',
  teatro: 'Teatro',
  galeria: 'Galeria',
  bar: 'Bar',
  club: 'Club',
  restaurante: 'Restaurante',
  auditorio: 'Auditorio',
  centro_cultural: 'Centro Cultural',
  general: 'Venue',
};

export default function VenueCard({ venue }: VenueCardProps) {
  const [imgError, setImgError] = useState(false);

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <Link
      href={`/venues/${venue.slug}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div
        className="p-5 flex items-start gap-4 transition-all duration-300 group-hover:scale-[1.01]"
        onMouseEnter={(e) => {
          e.currentTarget.closest('a')!.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.closest('a')!.style.borderColor = 'rgba(230, 57, 70, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.closest('a')!.style.boxShadow = 'var(--shadow)';
          e.currentTarget.closest('a')!.style.borderColor = 'var(--border)';
        }}
      >
        {/* Logo */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--card)' }}>
          {venue.logo && !imgError ? (
            <Image
              src={venue.logo}
              alt={venue.name}
              fill
              sizes="64px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xl font-bold"
              style={{ color: '#e63946', background: 'rgba(230, 57, 70, 0.08)' }}
            >
              {venue.name.charAt(0)}
            </div>
          )}
          {/* Verified badge */}
          {venue.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2a9d8f] rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-base font-semibold truncate group-hover:text-[#e63946] transition-colors"
              style={{ color: 'var(--fg)' }}
            >
              {venue.name}
            </h3>
          </div>

          {/* Category badge */}
          {venue.category && (
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2"
              style={{ background: 'var(--badge-bg)', color: 'var(--text-secondary)' }}
            >
              {categoryLabels[venue.category] || venue.category}
            </span>
          )}

          {venue.shortDescription && (
            <p
              className="text-sm line-clamp-2 mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {venue.shortDescription}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {venue.followerCount !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formatCount(venue.followerCount)} seguidores
              </span>
            )}
            {venue.eventsCount !== undefined && venue.eventsCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {venue.eventsCount} eventos
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-5 h-5" fill="none" stroke="var(--text-tertiary)" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
