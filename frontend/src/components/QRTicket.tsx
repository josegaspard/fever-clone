'use client';

import { Ticket } from '@/lib/api';

interface QRTicketProps {
  ticket: Ticket;
  onClose?: () => void;
}

export default function QRTicket({ ticket, onClose }: QRTicketProps) {
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Activo', color: 'text-green-400', bg: 'bg-green-400/10' },
    USED: { label: 'Usado', color: 'text-gray-400', bg: 'bg-gray-400/10' },
    CANCELLED: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10' },
  };

  const status = statusConfig[ticket.status] || statusConfig.ACTIVE;

  // Generate a barcode-like visual from the ticket code
  const barcodeLines = ticket.qrCode.split('').map((char, i) => {
    const width = (char.charCodeAt(0) % 3) + 1;
    const isBlack = i % 2 === 0;
    return { width, isBlack };
  });

  // Generate QR-like grid from code
  const gridSize = 9;
  const qrCells: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    qrCells[r] = [];
    for (let c = 0; c < gridSize; c++) {
      if (
        (r < 2 && c < 2) ||
        (r < 2 && c >= gridSize - 2) ||
        (r >= gridSize - 2 && c < 2)
      ) {
        qrCells[r][c] = true;
      } else {
        const idx = (r * gridSize + c) % ticket.qrCode.length;
        qrCells[r][c] = ticket.qrCode.charCodeAt(idx) % 2 === 0;
      }
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* Ticket card */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-[#e63946] via-[#FFB800] to-[#e63946]" />

        <div className="p-6 space-y-5">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Event info */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">{ticket.event?.title}</h3>
            <p className="text-sm text-gray-400">{formatDate(ticket.event?.date || '')}</p>
            {ticket.event?.time && (
              <p className="text-sm text-gray-400">{ticket.event.time}</p>
            )}
            {ticket.event?.address && (
              <p className="text-xs text-gray-500">{ticket.event.address}</p>
            )}
          </div>

          {/* Divider with holes */}
          <div className="relative flex items-center">
            <div className="w-4 h-4 bg-[#0a0a0a] rounded-full -ml-8" />
            <div className="flex-1 border-t border-dashed border-[#2a2a2a]" />
            <div className="w-4 h-4 bg-[#0a0a0a] rounded-full -mr-8" />
          </div>

          {/* QR-like visual */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-xl">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  width: 140,
                  height: 140,
                  gap: 0,
                }}
              >
                {qrCells.flat().map((filled, i) => (
                  <div
                    key={i}
                    style={{
                      width: 140 / gridSize,
                      height: 140 / gridSize,
                      backgroundColor: filled ? '#000' : '#fff',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Barcode visual */}
            <div className="flex items-end gap-[1px] h-10">
              {barcodeLines.map((line, i) => (
                <div
                  key={i}
                  className={line.isBlack ? 'bg-white' : 'bg-gray-600'}
                  style={{
                    width: line.width,
                    height: `${60 + (i % 3) * 10}%`,
                  }}
                />
              ))}
            </div>

            {/* Ticket code */}
            <div className="text-center">
              <p className="font-mono text-lg font-bold tracking-[0.3em] text-white">
                {ticket.qrCode}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                Presenta este codigo en la entrada
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          </div>

          {/* Download/Print button */}
          <button
            onClick={() => window.print()}
            className="w-full py-2.5 border border-[#2a2a2a] rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-400 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}
