import { z } from 'zod';

import { createStore } from '../createStore';

const ServerCacheEntry = z.object({
	key: z.string(),
	expiresAt: z.number(),
	data: z.unknown()
});
type ServerCacheEntry = z.infer<typeof ServerCacheEntry>;

const ServerCache = z.record(z.string(), ServerCacheEntry).transform(val => {
	const now = Date.now();
	return Object.fromEntries(
		Object.entries(val).filter(v => v[1].expiresAt >= now)
	);
});

const store = createStore({
	schema: ServerCache,
	file: 'fetch-cache.json'
});
const inFlight = new Map<string, Promise<unknown>>();

const withAbortSignal = async <T>(
	promise: Promise<T>,
	signal?: AbortSignal
) => {
	if (!signal) return promise;
	if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
	return await Promise.race([
		promise,
		new Promise<never>((_, reject) => {
			signal.addEventListener(
				'abort',
				() => reject(new DOMException('Aborted', 'AbortError')),
				{ once: true }
			);
		})
	]);
};

type GetOptions<T> = {
	key: string;
	revalidate?: boolean;
	ttl?: number;
	signal?: AbortSignal;
	callback: () => Promise<T>;
};

const FetchCache = {
	useLoaded: store.useLoaded,
	get: async <T>({ key, revalidate, ttl, signal, callback }: GetOptions<T>) => {
		if (ttl !== undefined && !revalidate) {
			const entry = store.get()[key];
			if (entry && entry.expiresAt >= Date.now()) return entry.data as T;
		}
		store.update({ [key]: undefined });

		const existing = inFlight.get(key);
		if (existing) {
			try {
				return await withAbortSignal(existing as Promise<T>, signal);
			} catch (e) {
				if (
					signal?.aborted ||
					(e instanceof DOMException && e.name === 'AbortError')
				)
					throw e;
			}
		}

		const promise = callback()
			.then(value => {
				if (ttl !== undefined)
					store.update({
						[key]: { key, expiresAt: Date.now() + ttl * 1000, data: value }
					});
				return value;
			})
			.finally(() => {
				if (inFlight.get(key) === promise) inFlight.delete(key);
			});

		inFlight.set(key, promise);
		return await withAbortSignal(promise, signal);
	},
	clear: () => store.set({})
};

export default FetchCache;
