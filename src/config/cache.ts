type CacheEntry<T> = {
  data: T;
  expiry: number;
};

const cache: Record<string, CacheEntry<any>> = {};

export function setCache<T>(key: string, data: T, ttl: number = 24 * 60 * 1000): void {
  cache[key] = {
    data,
    expiry: Date.now() + ttl,
  };
}

export function getCache<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    delete cache[key];
    return null;
  }

  return entry.data;
}

export function deleteCache(key: string): void {
  delete cache[key];
}