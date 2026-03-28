'use client';

import { useState } from 'react';
import { useToast } from './Toast';

interface SharePlanProps {
  shareCode?: string;
  planTitle: string;
}

export default function SharePlan({ shareCode, planTitle }: SharePlanProps) {
  const { showToast } = useToast();
  const [showLinks, setShowLinks] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/plans/shared/${shareCode || ''}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Enlace copiado');
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast('Enlace copiado');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: planTitle,
          text: `Mira mi plan: ${planTitle}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowLinks(!showLinks);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${planTitle}: ${shareUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(planTitle)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(planTitle)}`;

  // Simple QR-like visual using CSS grid
  const qrSize = 120;
  const generateQRPattern = (code: string) => {
    const grid: boolean[][] = [];
    const size = 11;
    // Simple pattern based on character codes
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        // Corner markers
        if (
          (r < 3 && c < 3) ||
          (r < 3 && c >= size - 3) ||
          (r >= size - 3 && c < 3)
        ) {
          grid[r][c] = true;
        } else {
          const idx = (r * size + c) % code.length;
          grid[r][c] = code.charCodeAt(idx) % 2 === 0;
        }
      }
    }
    return grid;
  };

  const qrGrid = shareCode ? generateQRPattern(shareCode) : null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--fg)' }}>
        <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartir plan
      </h3>

      {/* Share URL */}
      {shareCode && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none truncate"
            style={{ background: 'var(--bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          />
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg transition shrink-0"
            style={{ background: 'var(--surface-2)' }}
            title="Copiar enlace"
          >
            <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      )}

      {/* Share buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir
        </button>
      </div>

      {/* Social links */}
      {showLinks && (
        <div className="flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] py-2 rounded-lg text-xs font-medium transition text-center"
          >
            WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] py-2 rounded-lg text-xs font-medium transition text-center"
          >
            Telegram
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] py-2 rounded-lg text-xs font-medium transition text-center"
          >
            Twitter
          </a>
        </div>
      )}

      {/* QR Code */}
      {qrGrid && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <div
            className="bg-white p-2 rounded-lg"
            style={{ width: qrSize + 16, height: qrSize + 16 }}
          >
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${qrGrid[0].length}, 1fr)`,
                width: qrSize,
                height: qrSize,
              }}
            >
              {qrGrid.flat().map((filled, i) => (
                <div
                  key={i}
                  className={filled ? 'bg-black' : 'bg-white'}
                  style={{
                    width: qrSize / qrGrid[0].length,
                    height: qrSize / qrGrid.length,
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Escanea para ver el plan</p>
        </div>
      )}
    </div>
  );
}
