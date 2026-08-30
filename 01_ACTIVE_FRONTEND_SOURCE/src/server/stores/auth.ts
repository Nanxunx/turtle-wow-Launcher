import { type Client, Stronghold } from '@tauri-apps/plugin-stronghold';
import { z } from 'zod';
import { useEffect, useState } from 'react';

import { type SignInArgs } from '~/utils/schemas';
import { cachedFetch } from '~/server/modules/api';
import Toasts from '~/utils/toasts';
import { getAppDataDir, path } from '~/server/utils';
import { createStore } from '../createStore';
import Preferences from './preferences';

type AuthStore = {
	get: (key: string) => Promise<string | null>;
	set: (key: string, value: string) => Promise<void>;
	remove: (key: string) => Promise<void>;
};

const initStronghold = async (): Promise<AuthStore> => {
	if (import.meta.env.DEV) {
		console.info('[STRONGHOLD] Loaded DEV');
		const store = createStore({ schema: z.record(z.string(), z.string()), file: 'dev-auth.json' });
		return {
			get: async (key: string) => store.get()[key] ?? null,
			set: async (key: string, value: string) => store.update({ [key]: value }),
			remove: async (key: string) => store.update({ [key]: undefined })
		};
	}
	const strongholdPath = path.join(await getAppDataDir(), 'vault.hold');
	const stronghold = await Stronghold.load(strongholdPath, '[REDACTED_APP_VAULT_KEY]');
	let client: Client;
	try { client = await stronghold.loadClient('AuthClient'); }
	catch { client = await stronghold.createClient('AuthClient'); }
	const store = client.getStore();
	console.info('[STRONGHOLD] Loaded');
	return {
		get: async (key: string) => { const data = await store.get(key); if (!data) return null; return new TextDecoder().decode(data); },
		set: async (key: string, value: string) => { const data = Array.from(new TextEncoder().encode(value)); await store.insert(key, data); await stronghold.save(); },
		remove: async (key: string) => { await store.remove(key); await stronghold.save(); }
	};
};

let authStore: AuthStore | null = null;
initStronghold().then(store => { authStore = store; window.dispatchEvent(new Event('authStoreLoaded')); });

const removeAccount = async (account: string) => {
	Preferences.update({ savedAccounts: Preferences.get().savedAccounts.filter(a => a !== account), account: undefined });
	await authStore?.remove(account);
};

const Auth = {
	anonymizeAccount: (account: string) => account.replace(/(?<=.).(?=.*..@)/g, '*'),
	getToken: async (account?: string) => !account ? null : authStore?.get(account),
	signIn: async ({ region, ...args }: SignInArgs) => {
		const r = await cachedFetch({ url: '/api/auth', schema: z.object({ token: z.string().optional(), error: z.string().optional() }), method: 'POST', headers: { 'X-Server': region }, body: JSON.stringify(args) });
		if (!r.ok) return r;
		if (r.data.token) {
			const account = `${args.username}@${region}`;
			await authStore?.set(account, r.data.token);
			console.info(`[AUTH] Logged in as ${Auth.anonymizeAccount(account)}`);
			Preferences.update({ savedAccounts: [...Preferences.get().savedAccounts.filter(a => a !== account), account], account, version: undefined });
			return { ok: true as const };
		}
		return { ok: false as const, error: r.data.error ?? 'Unknown error' };
	},
	authenticate: async () => {
		const account = Preferences.get().account;
		if (!account) return undefined;
		const token = await authStore?.get(account);
		if (!token) { await removeAccount(account); Toasts.translated({ id: 'general.session_expired' }); return undefined; }
		const r = await cachedFetch({ url: '/api/auth', schema: z.boolean(), headers: { 'Authorization': `Bearer ${token}`, 'X-Server': account.split('@')[1] } });
		if (!r.ok) { Toasts.translated(r.error); return undefined; }
		if (!r.data) { await removeAccount(account); Toasts.translated({ id: 'general.session_expired' }); return undefined; }
		Preferences.update({ account });
		console.info(`[AUTH] Authenticated as ${Auth.anonymizeAccount(account)}`);
		return account;
	},
	signOut: async (account?: string) => {
		account ??= Preferences.get().account;
		if (!account) return;
		try {
			const token = await authStore?.get(account);
			if (!token) return;
			return await cachedFetch({ url: '/api/auth', schema: z.boolean(), method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'X-Server': account.split('@')[1] } });
		} finally { await removeAccount(account); }
	},
	useLoaded: () => {
		const [loaded, setLoaded] = useState(false);
		useEffect(() => {
			if (authStore) setLoaded(true);
			const controller = new AbortController();
			window.addEventListener('authStoreLoaded', () => setLoaded(true), { once: true, signal: controller.signal });
			return () => controller.abort();
		}, []);
		return loaded;
	}
};

export default Auth;
