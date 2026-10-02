const CACHE_VERSION = "atlas-public-data-v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = { expiresAt: number; data: T };

const pendingRequests = new Map<string, Promise<unknown>>();

function readCache<T>(key: string): CacheEntry<T> | null {
    try {
        const raw = localStorage.getItem(`${CACHE_VERSION}:${key}`);
        if (!raw) return null;
        const value = JSON.parse(raw) as CacheEntry<T>;
        if (!value || !Array.isArray(value.data) || typeof value.expiresAt !== "number") return null;
        return value;
    } catch {
        return null;
    }
}

/** Cache non-personal public geography data locally to avoid repeating the same API transfer. */
export function fetchCachedPublicData<T>(key: string, loader: () => Promise<T[]>): Promise<T[]> {
    const cached = readCache<T[]>(key);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data);

    const existing = pendingRequests.get(key) as Promise<T[]> | undefined;
    if (existing) return existing;

    const request = loader().then(data => {
        try {
            localStorage.setItem(`${CACHE_VERSION}:${key}`, JSON.stringify({
                expiresAt: Date.now() + CACHE_TTL_MS,
                data,
            } satisfies CacheEntry<T[]>));
        } catch {
            // Private browsing or full storage: the request still succeeds without persistence.
        }
        return data;
    }).catch(error => {
        // Keep read-only geography available during a transient outage, even if the cache expired.
        if (cached) return cached.data;
        throw error;
    }).finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, request);
    return request;
}
