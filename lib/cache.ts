/**
 * Multi-tier cache:
 * 1. In-memory LRU-style Map (always available, resets on cold start)
 * 2. Optional Upstash Redis for shared cross-instance caching
 *    Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Railway to enable.
 *
 * Falls back gracefully to in-memory if Redis is not configured.
 */

const DEFAULT_TTL_MS = parseInt(process.env.CACHE_TTL || "3600") * 1000;
const MAX_ENTRIES    = 2000; // prevent unbounded memory growth

interface CacheEntry<T> {
  data: T;
  ts: number;
  ttlMs: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

// ─── LRU-style cleanup ────────────────────────────────────────────────────────
function evict(): void {
  if (memCache.size < MAX_ENTRIES) return;
  // Remove oldest 20% of entries
  const toDelete = Math.floor(MAX_ENTRIES * 0.2);
  let deleted = 0;
  for (const key of memCache.keys()) {
    if (deleted++ >= toDelete) break;
    memCache.delete(key);
  }
}

// ─── Redis client (lazy) ──────────────────────────────────────────────────────
type UpstashResponse<T> = { result: T | null };

async function redisGet<T>(key: string): Promise<T | null> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    });
    const json = (await res.json()) as UpstashResponse<string>;
    if (!json.result) return null;
    return JSON.parse(json.result) as T;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  try {
    await fetch(`${url}/setex/${encodeURIComponent(key)}/${ttlSeconds}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(value),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Redis failures are non-fatal — in-memory cache still works
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  // 1. Check in-memory
  const entry = memCache.get(key) as CacheEntry<T> | undefined;
  if (entry) {
    if (Date.now() - entry.ts < entry.ttlMs) return entry.data;
    memCache.delete(key);
  }

  // 2. Check Redis
  const remote = await redisGet<T>(key);
  if (remote !== null) {
    // Warm local cache from Redis
    memCache.set(key, { data: remote, ts: Date.now(), ttlMs: DEFAULT_TTL_MS });
    return remote;
  }

  return null;
}

export async function cacheSet<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  evict();
  memCache.set(key, { data, ts: Date.now(), ttlMs });

  // Write-through to Redis
  const ttlSeconds = Math.floor(ttlMs / 1000);
  await redisSet(key, data, ttlSeconds);
}

export function cacheDelete(key: string): void {
  memCache.delete(key);
}

export function cacheStats(): { size: number; maxEntries: number } {
  return { size: memCache.size, maxEntries: MAX_ENTRIES };
}
