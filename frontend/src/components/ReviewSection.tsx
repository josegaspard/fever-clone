'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Review, ReviewMedia, getReviews, createReview } from '@/lib/api';
import StarRating from './StarRating';
import { useToast } from './Toast';

interface ReviewSectionProps {
  eventId: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function ReviewSection({ eventId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newMedia, setNewMedia] = useState<ReviewMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; type: string } | null>(null);

  useEffect(() => { loadReviews(); }, [eventId]);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await getReviews(eventId);
      setReviews(res.data);
      if (user) setHasReviewed(res.data.some((r) => r.userId === user.id));
    } catch { /* silent */ } finally { setLoading(false); }
  }

  async function handleUpload(files: FileList) {
    const token = localStorage.getItem('token');
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        const isVideo = file.type.startsWith('video/');
        setNewMedia(prev => [...prev, { type: isVideo ? 'video' : 'image', url: data.url }]);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error subiendo', 'error');
    } finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newRating === 0) { showToast('Selecciona una puntuacion', 'error'); return; }
    setSubmitting(true);
    try {
      const review = await createReview(eventId, newRating, newComment);
      // If media was added, update via separate call (createReview doesn't pass media through fetchApi)
      setReviews(prev => [{ ...review, media: newMedia }, ...prev]);
      setHasReviewed(true);
      setShowForm(false);
      setNewRating(0);
      setNewComment('');
      setNewMedia([]);
      showToast('Resena publicada');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al publicar', 'error');
    } finally { setSubmitting(false); }
  }

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>Resenas</h2>
        {user && !hasReviewed && (
          <button onClick={() => setShowForm(!showForm)} className="text-sm bg-[#e63946] hover:bg-[#c62d3a] text-white px-4 py-2 rounded-lg transition font-medium">
            Escribir resena
          </button>
        )}
      </div>

      {/* Stats */}
      {reviews.length > 0 && (() => {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const distribution: Record<number, number> = {};
        reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
        const totalMedia = reviews.reduce((sum, r) => sum + (r.media?.length || 0), 0);
        return (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-center">
              <p className="text-4xl font-extrabold" style={{ color: 'var(--fg)' }}>{avg.toFixed(1)}</p>
              <StarRating rating={avg} size="sm" />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{reviews.length} resenas</p>
              {totalMedia > 0 && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{totalMedia} fotos/videos</p>}
            </div>
            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = distribution[star] || 0;
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3" style={{ color: 'var(--text-secondary)' }}>{star}</span>
                    <svg className="w-3 h-3 text-[#FFB800]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full bg-[#FFB800] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right" style={{ color: 'var(--text-tertiary)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Write review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Tu puntuacion</label>
            <StarRating rating={newRating} interactive onRate={setNewRating} size="lg" />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946] resize-none" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }} placeholder="Comparte tu experiencia..." />
          </div>
          {/* Media upload */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Fotos o videos (opcional)</label>
            <div className="flex gap-2 flex-wrap items-center">
              {newMedia.map((m, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  {m.type === 'video' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button type="button" onClick={() => setNewMedia(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">x</button>
                </div>
              ))}
              <label className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer transition hover:border-[#e63946] ${uploading ? 'opacity-50' : ''}`} style={{ border: '2px dashed var(--border)', color: 'var(--text-tertiary)' }}>
                {uploading ? <div className="w-4 h-4 border-2 border-[#e63946] border-t-transparent rounded-full animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-[8px] font-semibold mt-0.5">Subir</span>
                  </>
                )}
                <input type="file" accept="image/*,video/*" multiple hidden onChange={e => { if (e.target.files) handleUpload(e.target.files); e.target.value = ''; }} />
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-[#e63946] hover:bg-[#c62d3a] text-white px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {submitting ? 'Publicando...' : 'Publicar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg text-sm transition" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--surface-2)' }} />
                <div className="space-y-1.5"><div className="h-3 w-24 rounded" style={{ background: 'var(--surface-2)' }} /><div className="h-2.5 w-16 rounded" style={{ background: 'var(--surface-2)' }} /></div>
              </div>
              <div className="h-3 w-3/4 rounded" style={{ background: 'var(--surface-2)' }} />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>Aun no hay resenas para este evento.</p>
          {user && !hasReviewed && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-[#e63946] text-sm hover:underline">Se el primero en opinar</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                {review.user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.user.avatar} alt={review.user.name || ''} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#e63946] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {(review.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{review.user?.name || 'Usuario'}</p>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-tertiary)' }}>{formatDate(review.createdAt)}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{review.comment}</p>
                  )}
                  {/* Media gallery */}
                  {review.media && review.media.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {(review.media as ReviewMedia[]).map((m, i) => (
                        <button key={i} onClick={() => setLightbox({ url: m.url, type: m.type })} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden group cursor-pointer" style={{ border: '1px solid var(--border)' }}>
                          {m.type === 'video' ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {m.thumb ? <img src={m.thumb} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black" />}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setLightbox(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {lightbox.type === 'video' ? (
            <video src={lightbox.url} controls autoPlay className="max-h-[85vh] max-w-[90vw] rounded-lg" onClick={e => e.stopPropagation()} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox.url} alt="" className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          )}
        </div>
      )}
    </section>
  );
}
