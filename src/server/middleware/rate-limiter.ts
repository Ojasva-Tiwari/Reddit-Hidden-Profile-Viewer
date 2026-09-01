/**
 * In-memory sliding-window rate limiter for server-side API endpoints.
 * Protects public endpoints from flooding.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const requestStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60000);
      if (record.timestamps.length === 0) {
        requestStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Checks and increments rate limit for a client identifier.
 * @param identifier IP or client key
 * @param maxRequests Maximum requests allowed within window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || "60", 10),
  windowMs = 60000
): RateLimitResult {
  const now = Date.now();
  let record = requestStore.get(identifier);

  if (!record) {
    record = { timestamps: [] };
    requestStore.set(identifier, record);
  }

  // Filter out timestamps outside current window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  const remaining = maxRequests - record.timestamps.length;
  const resetMs = windowMs;

  return {
    success: true,
    limit: maxRequests,
    remaining,
    resetMs,
  };
}
