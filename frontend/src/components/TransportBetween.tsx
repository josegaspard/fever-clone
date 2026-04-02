'use client';

import { useState } from 'react';

interface TransportBetweenProps {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromName: string;
  toName: string;
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Transport modes with speed (km/h) and icon
const MODES = [
  { key: 'walk', label: 'Caminando', icon: '🚶', speed: 5, color: '#2a9d8f' },
  { key: 'bus', label: 'Camión/Bus', icon: '🚌', speed: 18, color: '#3b82f6' },
  { key: 'metro', label: 'Metro', icon: '🚇', speed: 30, color: '#8b5cf6' },
  { key: 'uber', label: 'Uber/Taxi', icon: '🚗', speed: 25, color: '#f59e0b' },
  { key: 'bike', label: 'Bicicleta', icon: '🚲', speed: 15, color: '#10b981' },
];

export default function TransportBetween({ fromLat, fromLng, toLat, toLng, fromName, toName }: TransportBetweenProps) {
  const [expanded, setExpanded] = useState(false);
  const distance = haversine(fromLat, fromLng, toLat, toLng);

  // Format distance
  const distanceStr = distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;

  // Calculate times for each mode
  const modes = MODES.map(m => ({
    ...m,
    minutes: Math.max(2, Math.round((distance / m.speed) * 60)),
    // Estimated cost (MXN)
    cost: m.key === 'walk' || m.key === 'bike' ? 0 : m.key === 'metro' ? 5 : m.key === 'bus' ? 7 : Math.round(distance * 12 + 35),
  }));

  // Best mode (fastest reasonable option)
  const best = distance < 1.5 ? modes[0] : distance < 5 ? modes[1] : modes[2];

  // Google Maps directions URL
  const mapsUrl = `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;

  return (
    <div className="relative py-1">
      {/* Connector line */}
      <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: 'var(--border)' }} />

      {/* Collapsed: just show best option */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative z-10 ml-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition hover:opacity-80 w-full"
        style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
      >
        <span>{best.icon}</span>
        <span style={{ color: 'var(--text-secondary)' }}>
          {best.minutes} min · {distanceStr}
        </span>
        <span style={{ color: 'var(--text-tertiary)' }} className="text-[10px]">
          {best.label}
        </span>
        <svg className={`w-3 h-3 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded: all transport options */}
      {expanded && (
        <div className="relative z-10 ml-2 mt-1 rounded-xl p-3 space-y-1.5 animate-slide-up" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
            {fromName} → {toName}
          </p>
          {modes.map(m => (
            <div key={m.key} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition hover:opacity-80" style={{ background: distance < 1 && m.key !== 'walk' && m.key !== 'bike' ? 'transparent' : 'var(--surface)' }}>
              <span className="text-sm">{m.icon}</span>
              <span className="text-xs font-medium flex-1" style={{ color: 'var(--fg)' }}>{m.label}</span>
              <span className="text-xs font-bold" style={{ color: m.color }}>{m.minutes} min</span>
              {m.cost > 0 && (
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>~${m.cost}</span>
              )}
            </div>
          ))}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: '#3b82f6' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ver ruta en Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
