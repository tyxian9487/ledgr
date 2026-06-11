type CacheEntry = { rates: Record<string, number>; ts: number };
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetches latest exchange rates from open.er-api.com (free, no API key).
 * Returns rate multiplier: 1 unit of `from` = X units of `to`.
 * Returns null on network error or if rate not found.
 */
export async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;

  const now = Date.now();
  const cached = cache[from];
  if (cached && now - cached.ts < CACHE_TTL) {
    const rate = cached.rates[to];
    return typeof rate === 'number' ? rate : null;
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('API error');
    const rates: Record<string, number> = data.rates ?? {};
    cache[from] = { rates, ts: now };
    const rate = rates[to];
    return typeof rate === 'number' ? rate : null;
  } catch (e) {
    return null;
  }
}
