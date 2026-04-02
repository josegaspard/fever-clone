'use client';

import { useState } from 'react';
import { useToast } from './Toast';

interface ShareButtonProps {
  title: string;
  url?: string;
  description?: string;
}

export default function ShareButton({ title, url, description }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const text = description || title;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('Link copiado');
    setOpen(false);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title, text, url: shareUrl }).catch(() => {});
      setOpen(false);
    }
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`, '_blank');
    setOpen(false);
  };

  const twitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    setOpen(false);
  };

  const facebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    setOpen(false);
  };

  const telegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => typeof navigator !== 'undefined' && 'share' in navigator ? shareNative() : setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        Compartir
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl shadow-xl p-2 min-w-[200px] animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <button onClick={whatsapp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-[var(--card-hover)]" style={{ color: 'var(--fg)' }}>
              <span className="text-lg">💬</span> WhatsApp
            </button>
            <button onClick={twitter} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-[var(--card-hover)]" style={{ color: 'var(--fg)' }}>
              <span className="text-lg">𝕏</span> Twitter / X
            </button>
            <button onClick={facebook} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-[var(--card-hover)]" style={{ color: 'var(--fg)' }}>
              <span className="text-lg">📘</span> Facebook
            </button>
            <button onClick={telegram} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-[var(--card-hover)]" style={{ color: 'var(--fg)' }}>
              <span className="text-lg">✈️</span> Telegram
            </button>
            <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
            <button onClick={copyLink} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition hover:bg-[var(--card-hover)]" style={{ color: 'var(--fg)' }}>
              <span className="text-lg">🔗</span> Copiar enlace
            </button>
          </div>
        </>
      )}
    </div>
  );
}
