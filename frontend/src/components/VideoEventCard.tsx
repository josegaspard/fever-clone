'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/lib/api';

interface VideoEventCardProps {
  event: Event;
}

export default function VideoEventCard({ event }: VideoEventCardProps) {
  const currencySymbol = event.currency === 'MXN' ? '$' : event.currency === 'USD' ? '$' : event.currency === 'GBP' ? '£' : '€';
  const currencyLabel = event.currency || 'EUR';

  return (
    <Link href={`/events/${event.slug}`} className="group block" aria-label={`${event.title} - Video`}>
      <div className="video-event-card relative aspect-video rounded-2xl overflow-hidden border transition-all duration-500" style={{ borderColor: 'var(--border)' }}>
        {/* Video background */}
        {event.videoUrl ? (
          <video
            src={event.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
            poster={event.image}
          />
        ) : event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}

        {/* Play button center overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-70 group-hover:opacity-0 transition-opacity duration-500">
          <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-lg flex items-center justify-center border border-white/25 shadow-2xl">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-center gap-2 mb-2">
            {event.category && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-white/80 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {event.category.name}
              </span>
            )}
            {event.videoUrl && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-white/80 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Video
              </span>
            )}
          </div>
          <h3 className="text-white font-bold text-lg md:text-xl leading-tight line-clamp-2 mb-2">
            {event.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.city?.name || ''}</span>
            </div>
            <span className="text-white font-bold text-base">
              {event.price === 0 ? (
                <span className="text-green-400">Gratis</span>
              ) : (
                <>{currencySymbol}{event.price.toFixed(0)} <span className="text-xs font-normal text-white/60">{currencyLabel}</span></>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
