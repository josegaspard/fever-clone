'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/lib/api';

interface VideoEventCardProps {
  event: Event;
}

function getYouTubeId(url: string): string | null {
  // Handle /embed/ID format
  const embedMatch = url.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  // Handle watch?v=ID format
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  return null;
}

export default function VideoEventCard({ event }: VideoEventCardProps) {
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currencySymbol = event.currency === 'MXN' ? '$' : event.currency === 'USD' ? '$' : event.currency === 'GBP' ? '£' : '€';
  const currencyLabel = event.currency || 'MXN';

  const ytId = event.videoUrl ? getYouTubeId(event.videoUrl) : null;
  const isYouTube = !!ytId;
  const isRawVideo = event.videoUrl && !isYouTube;

  const handleMouseEnter = () => {
    setHovered(true);
    if (isRawVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    if (isYouTube) {
      setPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (isRawVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // On mobile: tap to play, tap link to navigate
  const handleTouchStart = () => {
    if (!playing && isYouTube) {
      setPlaying(true);
      setHovered(true);
    }
  };

  return (
    <div
      className="group relative aspect-video rounded-2xl overflow-hidden border transition-all duration-300"
      style={{ borderColor: hovered ? 'var(--text-tertiary)' : 'var(--border)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      {/* Poster image — always behind */}
      {event.image && (
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          priority={false}
        />
      )}

      {/* YouTube iframe — loads on hover/tap, autoplay + mute */}
      {isYouTube && playing && (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${ytId}&modestbranding=1&playsinline=1&start=154`}
          className="absolute inset-0 w-full h-full z-[1]"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={event.title}
          style={{ border: 'none' }}
        />
      )}

      {/* Raw video — plays on hover */}
      {isRawVideo && (
        <video
          ref={videoRef}
          src={event.videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
          poster={event.image}
          className={`absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Play indicator — shows when NOT playing */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform duration-300 group-hover:scale-110">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Gradient — always visible for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-[2] pointer-events-none" />

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-[3]">
        <div className="flex items-center gap-2 mb-2">
          {event.category && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
              {event.category.name}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider font-semibold text-white/90 bg-[#e63946]/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Video
          </span>
        </div>

        <Link href={`/events/${event.slug}`} className="block">
          <h3 className="text-white font-bold text-base sm:text-lg md:text-xl leading-tight line-clamp-2 mb-2 hover:underline decoration-white/30">
            {event.title}
          </h3>
        </Link>

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
  );
}
