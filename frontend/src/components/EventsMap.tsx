'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Event } from '@/lib/api';

interface EventsMapProps {
  events: Event[];
  routeEvents?: Event[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showRoute?: boolean;
  onEventClick?: (event: Event) => void;
}

const CATEGORY_COLORS: Record<string, { color: string; emoji: string }> = {
  conciertos: { color: '#e63946', emoji: '🎵' },
  musica: { color: '#e63946', emoji: '🎵' },
  concerts: { color: '#e63946', emoji: '🎵' },
  teatro: { color: '#9333ea', emoji: '🎭' },
  theater: { color: '#9333ea', emoji: '🎭' },
  gastronomia: { color: '#f59e0b', emoji: '🍽️' },
  gastronomy: { color: '#f59e0b', emoji: '🍽️' },
  arte: { color: '#3b82f6', emoji: '🎨' },
  art: { color: '#3b82f6', emoji: '🎨' },
  festivales: { color: '#ec4899', emoji: '🎪' },
  festivals: { color: '#ec4899', emoji: '🎪' },
  nightlife: { color: '#8b5cf6', emoji: '🌙' },
  'vida-nocturna': { color: '#8b5cf6', emoji: '🌙' },
  deportes: { color: '#10b981', emoji: '⚽' },
  sports: { color: '#10b981', emoji: '⚽' },
  museos: { color: '#6366f1', emoji: '🏛️' },
  museums: { color: '#6366f1', emoji: '🏛️' },
  tours: { color: '#14b8a6', emoji: '🗺️' },
  talleres: { color: '#f97316', emoji: '🛠️' },
  workshops: { color: '#f97316', emoji: '🛠️' },
  'experiencias-inmersivas': { color: '#06b6d4', emoji: '🌀' },
};

const DEFAULT_CAT = { color: '#6b7280', emoji: '📍' };

function getCatStyle(slug?: string) {
  if (!slug) return DEFAULT_CAT;
  return CATEGORY_COLORS[slug] || DEFAULT_CAT;
}

function createMarkerSvg(color: string, emoji: string, index?: number): string {
  const label = index !== undefined ? String(index + 1) : emoji;
  const isNumber = index !== undefined;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <path d="M18 44C18 44 36 26 36 16C36 7.16 28 0 18 0C8 0 0 7.16 0 16C0 26 18 44 18 44Z" fill="${color}"/>
      <circle cx="18" cy="16" r="12" fill="white"/>
      <text x="18" y="${isNumber ? '21' : '22'}" text-anchor="middle" font-size="${isNumber ? '14' : '16'}" font-weight="${isNumber ? '800' : '400'}" font-family="system-ui">${label}</text>
    </svg>
  `)}`;
}

export default function EventsMap({
  events,
  routeEvents,
  center,
  zoom = 13,
  height = '500px',
  showRoute = false,
  onEventClick,
}: EventsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  // Store module ref
  const LRef = useRef<typeof import('leaflet') | null>(null);

  // Filter events with valid coordinates
  const validEvents = events.filter(e => e.lat && e.lng);
  const routeEventsValid = routeEvents?.filter(e => e.lat && e.lng) || [];

  // Calculate center from events if not provided
  const mapCenter = center || (() => {
    const all = routeEventsValid.length > 0 ? routeEventsValid : validEvents;
    if (all.length === 0) return [19.4326, -99.1332] as [number, number];
    const avgLat = all.reduce((s, e) => s + (e.lat || 0), 0) / all.length;
    const avgLng = all.reduce((s, e) => s + (e.lng || 0), 0) / all.length;
    return [avgLat, avgLng] as [number, number];
  })();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled) return;
      LRef.current = L;

      // Fix default icon issue
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: mapCenter,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add event markers
      const bounds = L.latLngBounds([]);

      if (showRoute && routeEventsValid.length > 0) {
        // Route mode: numbered markers + polyline
        const latlngs: L.LatLngExpression[] = [];

        routeEventsValid.forEach((ev, i) => {
          const cat = getCatStyle(ev.category?.slug);
          const icon = L.icon({
            iconUrl: createMarkerSvg(cat.color, cat.emoji, i),
            iconSize: [36, 44],
            iconAnchor: [18, 44],
            popupAnchor: [0, -44],
          });

          const marker = L.marker([ev.lat!, ev.lng!], { icon }).addTo(map);
          const price = ev.price === 0 ? 'Gratis' : `$${ev.price}`;
          marker.bindPopup(`
            <div style="min-width:200px;font-family:system-ui">
              <strong style="font-size:14px">${i + 1}. ${ev.title}</strong>
              <p style="color:#666;font-size:12px;margin:4px 0">${ev.category?.name || ''} · ${ev.city?.name || ''}</p>
              <p style="font-weight:700;font-size:14px;color:${ev.price === 0 ? '#10b981' : '#e63946'}">${price}</p>
              ${ev.address ? `<p style="color:#999;font-size:11px;margin-top:4px">📍 ${ev.address}</p>` : ''}
            </div>
          `);

          bounds.extend([ev.lat!, ev.lng!]);
          latlngs.push([ev.lat!, ev.lng!]);
        });

        // Draw route polyline
        if (latlngs.length > 1) {
          L.polyline(latlngs, {
            color: '#e63946',
            weight: 3,
            opacity: 0.7,
            dashArray: '8, 8',
          }).addTo(map);
        }
      } else {
        // Browse mode: category-colored markers
        validEvents.forEach((ev) => {
          const cat = getCatStyle(ev.category?.slug);
          const icon = L.icon({
            iconUrl: createMarkerSvg(cat.color, cat.emoji),
            iconSize: [36, 44],
            iconAnchor: [18, 44],
            popupAnchor: [0, -44],
          });

          const marker = L.marker([ev.lat!, ev.lng!], { icon }).addTo(map);
          const price = ev.price === 0 ? 'Gratis' : `$${ev.price}`;
          marker.bindPopup(`
            <div style="min-width:220px;font-family:system-ui">
              ${ev.image ? `<img src="${ev.image}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px" />` : ''}
              <strong style="font-size:14px">${ev.title}</strong>
              <p style="color:#666;font-size:12px;margin:4px 0">${ev.category?.icon || ''} ${ev.category?.name || ''} · ${ev.city?.name || ''}</p>
              <p style="font-weight:700;font-size:14px;color:${ev.price === 0 ? '#10b981' : '#e63946'}">${price}</p>
              <a href="/events/${ev.slug}" style="display:inline-block;margin-top:6px;color:#e63946;font-size:12px;font-weight:600;text-decoration:none">Ver evento →</a>
            </div>
          `);

          marker.on('click', () => {
            setSelectedEvent(ev);
            onEventClick?.(ev);
          });

          bounds.extend([ev.lat!, ev.lng!]);
        });
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      mapInstance.current = map;
      setLeafletReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when events change
  useEffect(() => {
    if (!mapInstance.current || !leafletReady || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstance.current;

    // Clear existing layers except tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);
    const eventsToShow = showRoute ? routeEventsValid : validEvents;

    eventsToShow.forEach((ev, i) => {
      const cat = getCatStyle(ev.category?.slug);
      const icon = L.icon({
        iconUrl: createMarkerSvg(cat.color, cat.emoji, showRoute ? i : undefined),
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44],
      });

      const marker = L.marker([ev.lat!, ev.lng!], { icon }).addTo(map);
      const price = ev.price === 0 ? 'Gratis' : `$${ev.price}`;
      marker.bindPopup(`
        <div style="min-width:200px;font-family:system-ui">
          ${showRoute ? `<strong>${i + 1}. ${ev.title}</strong>` : `<strong>${ev.title}</strong>`}
          <p style="color:#666;font-size:12px;margin:4px 0">${ev.category?.icon || ''} ${ev.category?.name || ''}</p>
          <p style="font-weight:700;color:${ev.price === 0 ? '#10b981' : '#e63946'}">${price}</p>
        </div>
      `);

      bounds.extend([ev.lat!, ev.lng!]);
    });

    if (showRoute && routeEventsValid.length > 1) {
      const latlngs = routeEventsValid.map(e => [e.lat!, e.lng!] as L.LatLngExpression);
      L.polyline(latlngs, { color: '#e63946', weight: 3, opacity: 0.7, dashArray: '8, 8' }).addTo(map);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [events, routeEvents, showRoute, leafletReady, validEvents, routeEventsValid]);

  // Category legend
  const usedCategories = [...new Set(validEvents.map(e => e.category?.slug).filter(Boolean))];

  return (
    <div className="relative">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}
      />

      {/* Category legend */}
      {!showRoute && usedCategories.length > 0 && (
        <div
          className="absolute bottom-4 left-4 z-[1000] rounded-xl p-3 max-w-[200px]"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Categorias</p>
          <div className="space-y-1">
            {usedCategories.slice(0, 8).map(slug => {
              const cat = getCatStyle(slug!);
              const catData = validEvents.find(e => e.category?.slug === slug)?.category;
              return (
                <div key={slug} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{cat.emoji} {catData?.name || slug}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event count badge */}
      <div
        className="absolute top-4 right-4 z-[1000] rounded-lg px-3 py-1.5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>
          {showRoute ? `${routeEventsValid.length} paradas` : `${validEvents.length} eventos`}
        </span>
      </div>

      {/* Selected event preview */}
      {selectedEvent && !showRoute && (
        <div
          className="absolute bottom-4 right-4 z-[1000] rounded-xl overflow-hidden max-w-[280px] animate-slide-up"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <Link href={`/events/${selectedEvent.slug}`} className="block">
            {selectedEvent.image && (
              <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-28 object-cover" />
            )}
            <div className="p-3">
              <h4 className="text-sm font-bold line-clamp-1" style={{ color: 'var(--fg)' }}>{selectedEvent.title}</h4>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {selectedEvent.category?.icon} {selectedEvent.category?.name} · {selectedEvent.city?.name}
              </p>
              <p className="text-sm font-bold mt-1" style={{ color: selectedEvent.price === 0 ? '#10b981' : '#e63946' }}>
                {selectedEvent.price === 0 ? 'Gratis' : `$${selectedEvent.price}`}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-black/40 text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
