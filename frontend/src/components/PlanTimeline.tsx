'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlanItem, removePlanItem } from '@/lib/api';
import { useToast } from './Toast';

interface PlanTimelineProps {
  planId: string;
  items: PlanItem[];
  editable?: boolean;
  onItemRemoved?: (itemId: string) => void;
}

export default function PlanTimeline({
  planId,
  items,
  editable = false,
  onItemRemoved,
}: PlanTimelineProps) {
  const { showToast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => {
    const ta = a.startTime || '';
    const tb = b.startTime || '';
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return a.sortOrder - b.sortOrder;
  });

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      await removePlanItem(planId, itemId);
      onItemRemoved?.(itemId);
      showToast('Actividad eliminada');
    } catch {
      showToast('Error al eliminar', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const getItemStatus = (item: PlanItem) => {
    if (item.cost === 0) return 'free';
    if (item.isPaid) return 'confirmed';
    return 'pending';
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'free': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const statusBorder = (s: string) => {
    switch (s) {
      case 'confirmed': return 'border-green-500/30';
      case 'pending': return 'border-yellow-500/30';
      case 'free': return 'border-blue-500/30';
      default: return '';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendiente de pago';
      case 'free': return 'Gratis';
      default: return s;
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'confirmed': return '\u2705';
      case 'pending': return '\uD83D\uDCB3';
      case 'free': return '\u2705';
      default: return '';
    }
  };

  const statusTextColor = (s: string) => {
    switch (s) {
      case 'confirmed': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'free': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const totalCost = sorted.reduce((acc, item) => acc + (item.cost || 0), 0);

  const getMapsUrl = (from: PlanItem, to: PlanItem) => {
    const fromEvent = from.event as Record<string, unknown> | null;
    const toEvent = to.event as Record<string, unknown> | null;
    // Prefer lat/lng coordinates
    const fLat = Number(fromEvent?.lat);
    const fLng = Number(fromEvent?.lng);
    const tLat = Number(toEvent?.lat);
    const tLng = Number(toEvent?.lng);
    if (!isNaN(fLat) && !isNaN(fLng) && !isNaN(tLat) && !isNaN(tLng) && fromEvent?.lat && toEvent?.lat) {
      return `https://www.google.com/maps/dir/?api=1&origin=${fLat},${fLng}&destination=${tLat},${tLng}&travelmode=driving`;
    }
    // Fallback to address
    const origin = encodeURIComponent((fromEvent?.address as string) || (fromEvent?.city as Record<string, unknown>)?.name as string || '');
    const dest = encodeURIComponent((toEvent?.address as string) || (toEvent?.city as Record<string, unknown>)?.name as string || '');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  };

  // Rough estimate of travel time based on straight-line distance
  const estimateTravelMin = (from: PlanItem, to: PlanItem): number | null => {
    const fromEvent = from.event as Record<string, unknown> | null;
    const toEvent = to.event as Record<string, unknown> | null;
    if (from.travelDuration != null) return Math.round(from.travelDuration);
    if (!fromEvent?.lat || !fromEvent?.lng || !toEvent?.lat || !toEvent?.lng) return null;
    const lat1 = Number(fromEvent.lat);
    const lng1 = Number(fromEvent.lng);
    const lat2 = Number(toEvent.lat);
    const lng2 = Number(toEvent.lng);
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return null;
    // Haversine approximation for distance in km
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Assume ~30 km/h average city speed
    return Math.max(5, Math.round(dist / 30 * 60));
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p style={{ color: 'var(--text-secondary)' }}>No hay actividades en este Day</p>
        <Link href="/search" className="inline-block mt-3 text-sm text-[#e63946] hover:underline">
          Explorar eventos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((item, idx) => {
        const itemStatus = getItemStatus(item);
        const travelMin = idx < sorted.length - 1 ? estimateTravelMin(item, sorted[idx + 1]) : null;
        return (
          <div key={item.id}>
            <div className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3.5 h-3.5 rounded-full ${statusColor(itemStatus)} ring-4 z-10 shrink-0`} style={{ ['--tw-ring-color' as string]: 'var(--bg)' }} />
                {idx < sorted.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[20px]" style={{ background: 'var(--border)' }} />
                )}
              </div>
              <div className={`flex-1 pb-6 ${removingId === item.id ? 'opacity-50' : ''} transition-opacity`}>
                <div className={`border ${statusBorder(itemStatus)} rounded-xl p-4 relative group`} style={{ background: 'var(--card)' }}>
                  {editable && (
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:text-red-400 hover:border-red-400/30 opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'var(--bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  {item.startTime && (
                    <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.startTime}{item.endTime ? ` - ${item.endTime}` : ''}
                    </p>
                  )}
                  <div className="flex gap-3">
                    {item.event?.image && (
                      <Link href={`/events/${item.event.slug}`} className="shrink-0">
                        <img src={item.event.image} alt={item.event.title || ''} className="w-16 h-16 rounded-lg object-cover" />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/events/${item.event?.slug || ''}`} className="text-sm font-semibold hover:text-[#e63946] transition line-clamp-1" style={{ color: 'var(--fg)' }}>
                        {item.event?.title || 'Evento'}
                      </Link>
                      {item.event?.address && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{item.event.address}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusTextColor(itemStatus)}`}>
                          {statusIcon(itemStatus)} {statusLabel(itemStatus)}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--fg)' }}>
                          {item.cost === 0 ? 'Gratis' : `$${item.cost.toFixed(2)} MXN`}
                        </span>
                      </div>
                      {item.notes && <p className="text-xs mt-1.5 italic" style={{ color: 'var(--text-tertiary)' }}>{item.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Travel route card between items */}
            {idx < sorted.length - 1 && (() => {
              const fromEv = item.event as Record<string, unknown> | null;
              const toEv = sorted[idx + 1].event as Record<string, unknown> | null;
              const fLat = Number(fromEv?.lat), fLng = Number(fromEv?.lng);
              const tLat = Number(toEv?.lat), tLng = Number(toEv?.lng);
              const hasCoords = !isNaN(fLat) && !isNaN(tLat) && fromEv?.lat && toEv?.lat;
              // Haversine distance
              const dist = hasCoords ? (() => {
                const R = 6371, dLa = (tLat - fLat) * Math.PI / 180, dLo = (tLng - fLng) * Math.PI / 180;
                const a = Math.sin(dLa / 2) ** 2 + Math.cos(fLat * Math.PI / 180) * Math.cos(tLat * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
                return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              })() : null;
              const distStr = dist ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : null;
              const walkMin = dist ? Math.max(2, Math.round(dist / 5 * 60)) : null;
              const busMin = dist ? Math.max(3, Math.round(dist / 18 * 60)) : null;
              const metroMin = dist ? Math.max(5, Math.round(dist / 30 * 60)) : null;
              const uberMin = dist ? Math.max(3, Math.round(dist / 25 * 60)) : null;
              const mapsUrl = getMapsUrl(item, sorted[idx + 1]);

              return (
                <div className="relative flex gap-4 mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 flex-1 border-l-2 border-dashed ml-[0.3rem]" style={{ minHeight: '40px', borderColor: 'var(--border)' }} />
                  </div>
                  <div className="flex-1 py-1">
                    <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
                      {distStr && (
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--text-secondary)' }}>
                            📍 {distStr}
                          </span>
                          {walkMin && walkMin <= 30 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: '#2a9d8f' }}>
                              🚶 {walkMin} min
                            </span>
                          )}
                          {busMin && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: '#3b82f6' }}>
                              🚌 {busMin} min
                            </span>
                          )}
                          {metroMin && dist && dist > 2 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: '#8b5cf6' }}>
                              🚇 {metroMin} min
                            </span>
                          )}
                          {uberMin && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: '#f59e0b' }}>
                              🚗 {uberMin} min
                            </span>
                          )}
                        </div>
                      )}
                      {/* Tips */}
                      {dist && dist > 3 && (
                        <p className="text-[9px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          💡 {dist > 10 ? 'Distancia larga — considera Metro o Uber' : 'Tip: en hora pico (7-9am, 5-8pm) puede tardar el doble en auto'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-medium hover:underline transition"
                          style={{ color: '#3b82f6' }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Ver ruta
                        </a>
                        <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>|</span>
                        <button className="flex items-center gap-1 text-[10px] font-semibold transition hover:opacity-80" style={{ color: '#e63946' }}>
                          🚐 CTXplorer Plus: te llevamos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
      <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'var(--border)' }}>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Costo total estimado</span>
        <span className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{totalCost === 0 ? 'Gratis' : `$${totalCost.toFixed(2)} MXN`}</span>
      </div>
    </div>
  );
}
