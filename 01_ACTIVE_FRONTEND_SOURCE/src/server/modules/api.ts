import { z } from 'zod';
import { fetch } from '@tauri-apps/plugin-http';
import { app } from '@tauri-apps/api';
import { Command } from '@tauri-apps/plugin-shell';
import { FileManifest, Manifest, ModsManifest, PatchManifest, type LocalizedMessage } from '~/utils';
import { RegionSchema, VersionSchema, MirrorSchema, TwitterPostSchema, ForumPostSchema, CalendarEventSchema } from '~/utils/schemas';
import { getBuildTarget, isLinux } from '../utils';
import FetchCache from '../stores/fetchCache';
import Preferences from '../stores/preferences';
import Auth from '../stores/auth';
import Context from '../stores/context';

export type AsyncCtx = { signal: AbortSignal };
export const assertNotAborted = (ctx?: AsyncCtx) => { if (ctx?.signal.aborted) throw new DOMException('Aborted', 'AbortError'); };

type FetchOptions<Input extends z.ZodTypeAny = z.ZodString, Ret = z.infer<Input>> = { url: string; schema: Input; ttl?: number; revalidate?: boolean; transform?: (data: z.infer<Input>) => Promise<Ret>; noAuth?: true; method?: 'GET' | 'POST' | 'DELETE'; headers?: Record<string, string>; body?: BodyInit; ctx?: AsyncCtx; };

export const cachedFetch = async <Input extends z.ZodTypeAny, Ret = z.infer<Input>>({ url, schema, ttl, revalidate, transform, noAuth, method = 'GET', headers = {}, body, ctx }: FetchOptions<Input, Ret>): Promise<{ ok: false; error: LocalizedMessage } | { ok: true; data: Ret }> => {
	if (Context.get().offline) return { ok: false as const, error: { id: 'general.server_unreachable' } };
	type FailedFetch = { fetchResult: { ok: false; error: LocalizedMessage } };
	const fail = (error: LocalizedMessage) => ({ fetchResult: { ok: false as const, error } } satisfies FailedFetch);
	return await FetchCache.get<Ret>({
		key: url, revalidate, ttl, signal: ctx?.signal,
		callback: async () => {
			const requestUrl = Preferences.serverUrl() + url;
			const devSecret = Preferences.get().devSecret;
			const requestHeaders = { ...headers };
			if (devSecret) requestHeaders['X-Api-Secret'] = devSecret;
			const account = Preferences.get().account;
			if (!noAuth) { const token = await Auth.getToken(account); if (token) requestHeaders.Authorization = `Bearer ${token}`; }
			const region = account?.split('@')[1];
			if (region) requestHeaders['X-Server'] = region;
			requestHeaders['X-Client-Version'] = await app.getVersion();
			const r = await fetch(requestUrl, { method, headers: requestHeaders, body }).catch(e => {
				const message = e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);
				return { ok: false as const, status: 500, statusText: message, text: () => Promise.resolve(message) };
			});
			if (!r.ok) {
				if (r.status === 401) { Preferences.update({ account: undefined }); throw fail({ id: 'general.unauthorized' }); }
				console.warn(`[Fetch] Failed to fetch "${url}"`, r.status, await r.text().then(m => m?.slice(0, 1024)).catch(() => r.statusText));
				if (r.status >= 501) Context.update({ offline: true });
				throw fail({ id: 'general.server_unreachable' });
			}
			const responseText = await r.text();
			let parsed: z.infer<Input>;
			try { parsed = schema.parse(JSON.parse(responseText)); }
			catch (e) { console.error(`[Fetch] Failed to parse response "${url}"`, e); throw fail({ id: 'general.unexpected_error', values: { file: url } }); }
			try { return (transform ? await transform(parsed) : parsed) as Ret; }
			catch (e) { if (e instanceof Error && e.cause === 'ERR_STATUS') throw fail(e.message); console.error(`[Fetch] Failed to transform response "${url}"`, e); throw fail({ id: 'general.unexpected_error', values: { file: url } }); }
		}
	}).then(data => ({ ok: true as const, data })).catch(e => {
		const fetchResult = (e as FailedFetch | undefined)?.fetchResult;
		if (fetchResult) return fetchResult;
		if (e instanceof Error && e.name === 'AbortError') throw e;
		console.error(`[Fetch] Unexpected error during request "${url}"`, e);
		return { ok: false as const, error: { id: 'general.unexpected_error', values: { file: url } } };
	});
};

export const AvailableAddon = z.object({ git: z.string(), gitRef: z.string().optional(), region: z.string().optional() });
export type AvailableAddon = z.infer<typeof AvailableAddon>;
export const fetchAddons = async (revalidate?: boolean, ctx?: AsyncCtx) => { const r = await cachedFetch({ url: '/api/addons', schema: z.array(AvailableAddon), ttl: 30 * 24 * 60 * 60, revalidate, noAuth: true, ctx }); return r.ok ? r.data : []; };
export const fetchLauncherManifest = async (revalidate?: boolean, ctx?: AsyncCtx): Promise<FileManifest | null> => { const r = await cachedFetch({ url: `/api/launcher/TurtleWoW.${getBuildTarget()}${Preferences.get().betaUpdates ? '?beta' : ''}`, schema: FileManifest, ttl: 60 * 60, revalidate, noAuth: true, ctx }); return r.ok ? r.data : null; };
export const fetchManifest = async (revalidate?: boolean, ctx?: AsyncCtx): Promise<Manifest | null> => { const version = Preferences.get().version ?? Preferences.get().account?.split('@')[1]; if (!version) return null; const r = await cachedFetch({ url: `/api/manifest/${version}${Preferences.get().unpublishedChanges ? '?dev' : ''}`, schema: Manifest, ttl: 60 * 60, revalidate, noAuth: true, ctx }); return r.ok ? r.data : null; };
export const fetchLanguageManifest = async (revalidate?: boolean, ctx?: AsyncCtx): Promise<PatchManifest> => { if (Preferences.get().language === 'en') return { key: 'Z', name: 'locale_en', files: [] }; const r = await cachedFetch({ url: `/api/manifest/language/${Preferences.get().language}${Preferences.get().unpublishedChanges ? '?dev' : ''}`, schema: PatchManifest, ttl: 60 * 60, revalidate, noAuth: true, ctx }); return r.ok ? r.data : { key: 'Z', name: 'locale_en', files: [] }; };
export const fetchModsManifest = async (revalidate?: boolean, ctx?: AsyncCtx) => { const r = await cachedFetch({ url: `/api/manifest/mods${Preferences.get().betaUpdates ? '?beta' : ''}`, schema: ModsManifest, ttl: 60 * 60, revalidate, noAuth: true, ctx }); return r.ok ? r.data : []; };
export const fetchVersions = async (revalidate?: boolean, ctx?: AsyncCtx) => await cachedFetch({ url: '/api/versions', schema: z.array(VersionSchema), ttl: 24 * 60 * 60, revalidate, noAuth: true, ctx });
export const fetchRegions = async (revalidate?: boolean, ctx?: AsyncCtx) => await cachedFetch({ url: '/api/regions', schema: z.array(RegionSchema), ttl: 24 * 60 * 60, revalidate, noAuth: true, ctx });
export const getRegionByName = async (region?: string, ctx?: AsyncCtx) => { const response = await fetchRegions(false, ctx); if (!response.ok) return null; region ??= Preferences.get().account?.split('@')[1]; return response.data.find(s => s.name === region); };
export const fetchMirrors = async (revalidate?: boolean, ctx?: AsyncCtx) => await cachedFetch({ url: '/api/mirrors', schema: z.record(z.string(), MirrorSchema), ttl: 24 * 60 * 60, revalidate, transform: async data => Object.entries(data).map(([key, val]) => ({ key, ...val })), noAuth: true, ctx });
export const fetchTweets = async (revalidate?: boolean, ctx?: AsyncCtx) => cachedFetch({ url: '/api/news/tweets', schema: z.array(TwitterPostSchema), ttl: 60 * 60, revalidate, noAuth: true, ctx });
export const fetchRadioCalendar = async (revalidate?: boolean, ctx?: AsyncCtx) => cachedFetch({ url: '/api/news/radio', schema: z.array(CalendarEventSchema), ttl: 60 * 60, revalidate, noAuth: true, ctx });
export const fetchChangelogs = async (region?: string, revalidate?: boolean, ctx?: AsyncCtx) => cachedFetch({ url: `/api/news/changelogs?region=${region}`, schema: z.array(ForumPostSchema), ttl: 60 * 60, revalidate, noAuth: true, ctx });
export const logActivity = async (type: string, detail?: unknown, _withLog?: boolean, _ctx?: AsyncCtx) => { if (import.meta.env.DEV) return; const now = Date.now(); const lastActivity = Preferences.get().lastActivityLogTime; const lastSent = lastActivity[type]; if (lastSent && now - lastSent < 24 * 60 * 60 * 1000) return; Preferences.update({ lastActivityLogTime: { ...lastActivity, [type]: now } }); console.info(`[API] Logging activity ${type}:`, JSON.stringify(detail, null, 2)); };
export const checkDxvk = async () => { if (isLinux) return 'supported'; return await FetchCache.get({ key: 'check_dxvk_support', ttl: 7 * 24 * 60 * 60, callback: async () => await Command.sidecar('binaries/gpu-check').execute().then(res => { switch (res.code) { case 1: return 'supported' as const; case 2: return 'recommended' as const; default: return 'unsupported' as const; } }).catch(e => { console.error('Failed to execute GPU check binary:', e); return 'unsupported' as const; }) }); };
