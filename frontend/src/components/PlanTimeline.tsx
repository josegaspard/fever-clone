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
      default: return 'border-[#2a2a2a]';
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
      case 'confirmed': return 'bg-green-500/10 text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400';
      case 'free': return 'bg-blue-500/10 text-blue-400';
      default: return 'bg-gray-500/10 text-gray-400';
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
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400">No hay actividades en este Day</p>
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
                <div className={`w-3.5 h-3.5 rounded-full ${statusColor(itemStatus)} ring-4 ring-[#0a0a0a] z-10 shrink-0`} />
                {idx < sorted.length - 1 && (
                  <div className="w-0.5 flex-1 bg-[#2a2a2a] min-h-[20px]" />
                )}
              </div>
              <div className={`flex-1 pb-6 ${removingId === item.id ? 'opacity-50' : ''} transition-opacity`}>
                <div className={`bg-[#1a1a1a] border ${statusBorder(itemStatus)} rounded-xl p-4 relative group`}>
                  {editable && (
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center text-gray-500 hover:text-red-400 hover:border-red-400/30 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  {item.startTime && (
                    <p className="text-xs font-mono text-gray-400 mb-2">
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
                      <Link href={`/events/${item.event?.slug || ''}`} className="text-sm font-semibold text-white hover:text-[#e63946] transition line-clamp-1">
                        {item.event?.title || 'Evento'}
                      </Link>
                      {item.event?.address && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.event.address}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusTextColor(itemStatus)}`}>
                          {statusIcon(itemStatus)} {statusLabel(itemStatus)}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {item.cost === 0 ? 'Gratis' : `$${item.cost.toFixed(2)} MXN`}
                        </span>
                      </div>
                      {item.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{item.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Travel route card between items */}
            {idx < sorted.length - 1 && (
              <div className="relative flex gap-4 mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 flex-1 border-l-2 border-dashed border-[#2a2a2a] ml-[0.3rem]" style={{ minHeight: '40px' }} />
                </div>
                <div className="flex-1 py-1">
                  <a
                    href={getMapsUrl(item, sorted[idx + 1])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-[#111] border border-[#2a2a2a] hover:border-[#e63946]/50 rounded-lg px-3 py-2.5 transition group"
                  >
                    <span className="text-lg">&#x1F697;</span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-300 group-hover:text-white transition">Ver ruta en Google Maps</p>
                      {travelMin && (
                        <p className="text-[10px] text-gray-500">~{travelMin} min en auto</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-[#e63946] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-between">
        <span className="text-sm text-gray-400">Costo total estimado</span>
        <span className="text-lg font-bold text-white">{totalCost === 0 ? 'Gratis' : `$${totalCost.toFixed(2)} MXN`}</span>
      </div>
    </div>
  );
}
