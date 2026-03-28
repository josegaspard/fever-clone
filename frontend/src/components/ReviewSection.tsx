'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Review, getReviews, createReview } from '@/lib/api';
import StarRating from './StarRating';
import { useToast } from './Toast';

interface ReviewSectionProps {
  eventId: string;
  averageRating?: number;
  reviewCount?: number;
}

export default function ReviewSection({ eventId, averageRating, reviewCount }: ReviewSectionProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [eventId]);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await getReviews(eventId);
      setReviews(res.data);
      if (user) {
        setHasReviewed(res.data.some((r) => r.userId === user.id));
      }
    } catch {
      // Reviews not available
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newRating === 0) {
      showToast('Selecciona una puntuacion', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const review = await createReview(eventId, newRating, newComment);
      setReviews((prev) => [review, ...prev]);
      setHasReviewed(true);
      setShowForm(false);
      setNewRating(0);
      setNewComment('');
      showToast('Resena publicada');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al publicar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>Resenas</h2>
        {user && !hasReviewed && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-[#e63946] hover:bg-[#c62d3a] px-4 py-2 rounded-lg transition font-medium"
          >
            Escribir resena
          </button>
        )}
      </div>

      {/* Stats */}
      {reviews.length > 0 && (() => {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const distribution: Record<number, number> = {};
        reviews.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
        return (
          <div className="flex items-center gap-6 rounded-xl p-5" style={{ background: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
            <div className="text-center">
              <p className="text-4xl font-extrabold" style={{ color: 'var(--fg)' }}>{avg.toFixed(1)}</p>
              <StarRating rating={avg} size="sm" />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{reviews.length} resenas</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3" style={{ color: 'var(--text-secondary)' }}>{star}</span>
                    <svg className="w-3 h-3 text-[#FFB800]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="h-full bg-[#FFB800] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
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
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-5 space-y-4"
          style={{ background: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
        >
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Tu puntuacion</label>
            <StarRating rating={newRating} interactive onRate={setNewRating} size="lg" />
          </div>
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Comentario</label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#e63946] resize-none"
              style={{ background: 'var(--bg)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--fg)' }}
              placeholder="Comparte tu experiencia..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#e63946] hover:bg-[#c62d3a] px-6 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Publicando...' : 'Publicar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 rounded-lg text-sm transition"
              style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--surface-2)' }} />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded" style={{ background: 'var(--surface-2)' }} />
                  <div className="h-2.5 w-16 rounded" style={{ background: 'var(--surface-2)' }} />
                </div>
              </div>
              <div className="h-3 w-3/4 rounded" style={{ background: 'var(--surface-2)' }} />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>Aun no hay resenas para este evento.</p>
          {user && !hasReviewed && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-[#e63946] text-sm hover:underline"
            >
              Se el primero en opinar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl p-5"
              style={{ background: 'var(--card)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-3">
                {review.user?.avatar ? (
                  <img
                    src={review.user.avatar}
                    alt={review.user.name || ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#e63946] flex items-center justify-center text-sm font-bold shrink-0">
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
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      )}
    </section>
  );
}
