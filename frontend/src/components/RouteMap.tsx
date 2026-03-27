'use client';

import { useState } from 'react';
import { PlanItem } from '@/lib/api';

interface RouteMapProps {
  items: PlanItem[];
  onClose?: () => void;
}

export default function RouteMap({ items, onClose }: RouteMapProps) {
  const [expanded, setExpanded] = useState(false);

  const withCoords = items.filter((i) => {
    const ev = i.event as Record<string, unknown> | null;
    return ev && ev.lat && ev.lng && !isNaN(Number(ev.lat)) && !isNaN(Number(ev.lng));
  }).sort((a, b) => {
    const ta = a.startTime || '';
    const tb = b.startTime || '';
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return a.sortOrder - b.sortOrder;
  });

  if (withCoords.length < 2) return null;

  // Build Google Maps Directions URL
  const first = withCoords[0].event as Record<string, unknown>;
  const last = withCoords[withCoords.length - 1].event as Record<string, unknown>;
  const origin = `${first.lat},${first.lng}`;
  const destination = `${last.lat},${last.lng}`;
  const waypoints = withCoords.slice(1, -1).map((i) => {
    const ev = i.event as Record<string, unknown>;
    return `${ev.lat},${ev.lng}`;
  }).join('|');

  // Embed URL with directions
  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&mode=driving`;

  // Link URL
  const linkUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&travelmode=driving`;

  const height = expanded ? '85vh' : '350px';

  return (
    <div className={`${expanded ? 'fixed inset-0 z-[100] bg-black/90 flex flex-col' : 'relative'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${expanded ? 'px-4 py-3 bg-[#0a0a0a]' : 'mb-3'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#e63946]/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-[#e63946]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ruta de tu Day</p>
            <p className="text-xs text-gray-500">{withCoords.length} paradas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5"
            title={expanded ? 'Minimizar' : 'Pantalla completa'}
          >
            {expanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
          {onClose && !expanded && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className={`${expanded ? 'flex-1' : ''} rounded-2xl overflow-hidden border border-[#1f1f1f]`} style={{ height: expanded ? undefined : height }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ruta del Day"
        />
      </div>

      {/* Stops list */}
      <div className={`${expanded ? 'px-4 py-3 bg-[#0a0a0a] max-h-[25vh] overflow-y-auto' : 'mt-3'}`}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {withCoords.map((item, idx) => (
            <div key={item.id} className="flex items-center shrink-0">
              <div className="flex items-center gap-2 bg-[#141414] border border-[#1f1f1f] rounded-xl px-3 py-2">
                <div className="w-6 h-6 bg-[#e63946] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate max-w-[120px]">{item.event?.title || 'Evento'}</p>
                  {item.startTime && <p className="text-[10px] text-gray-500">{item.startTime}</p>}
                </div>
              </div>
              {idx < withCoords.length - 1 && (
                <svg className="w-4 h-4 text-gray-600 mx-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Open in Google Maps */}
      <div className={`${expanded ? 'px-4 pb-4 bg-[#0a0a0a]' : 'mt-3'}`}>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#141414] border border-[#1f1f1f] hover:border-[#e63946]/30 rounded-xl text-sm text-gray-300 hover:text-white transition font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Abrir en Google Maps
        </a>
      </div>
    </div>
  );
}
