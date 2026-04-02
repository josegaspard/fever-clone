// Simple in-memory rate limiter for API routes
// In production, use Redis or similar for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs?: number; // Time window in ms (default: 60s)
  max?: number;      // Max requests per window (default: 30)
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { success: boolean; remaining: number; resetAt: number } {
  const { windowMs = 60_000, max = 30 } = config;
  const now = Date.now();

  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count++;

  if (entry.count > max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
  );
}

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
