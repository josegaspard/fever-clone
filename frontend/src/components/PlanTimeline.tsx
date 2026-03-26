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
      case 'pending': return 'Pago pendiente';
      case 'free': return 'Gratis';
      default: return s;
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
    const origin = encodeURIComponent(from.event?.address || from.event?.city?.name || '');
    const dest = encodeURIComponent(to.event?.address || to.event?.city?.name || '');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${from.travelMode || 'driving'}`;
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400">No hay actividades en este plan</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                          {statusLabel(itemStatus)}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {item.cost === 0 ? 'Gratis' : `${item.cost.toFixed(2)}\u20AC`}
                        </span>
                      </div>
                      {item.notes && <p className="text-xs text-gray-500 mt-1.5 italic">{item.notes}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {idx < sorted.length - 1 && (
              <div className="relative flex gap-4 mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 flex-1 border-l-2 border-dashed border-[#2a2a2a] ml-[0.3rem]" style={{ minHeight: '40px' }} />
                </div>
                <div className="flex-1 py-1">
                  <a href={getMapsUrl(item, sorted[idx + 1])} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#e63946] transition px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Ver ruta en Google Maps
                    {item.travelDuration != null && <span className="text-gray-600">({Math.round(item.travelDuration)} min)</span>}
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-between">
        <span className="text-sm text-gray-400">Costo total estimado</span>
        <span className="text-lg font-bold text-white">{totalCost === 0 ? 'Gratis' : `${totalCost.toFixed(2)}\u20AC`}</span>
      </div>
    </div>
  );
}
