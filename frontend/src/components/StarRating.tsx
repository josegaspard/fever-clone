'use client';

import { useState } from 'react';

interface StarRatingProps {
  rating?: number;
  count?: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating = 0,
  count,
  interactive = false,
  size = 'md',
  onRate,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';

  const displayRating = hovered || rating;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => interactive && setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayRating >= star;
          const halfFilled = !filled && displayRating >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
              onClick={() => interactive && onRate?.(star)}
              onMouseEnter={() => interactive && setHovered(star)}
            >
              <svg
                className={`${sizeClass} transition-colors`}
                viewBox="0 0 24 24"
                fill={filled ? '#FFB800' : halfFilled ? 'url(#half)' : 'none'}
                stroke={filled || halfFilled ? '#FFB800' : '#4a4a4a'}
                strokeWidth={1.5}
              >
                {halfFilled && (
                  <defs>
                    <linearGradient id="half">
                      <stop offset="50%" stopColor="#FFB800" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                )}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <span className={`${textSize} font-semibold`} style={{ color: 'var(--fg)' }}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={`${textSize}`} style={{ color: 'var(--text-secondary)' }}>
          ({count})
        </span>
      )}
    </div>
  );
}
