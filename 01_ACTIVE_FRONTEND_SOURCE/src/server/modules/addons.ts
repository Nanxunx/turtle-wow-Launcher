import * as fs from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import { z } from 'zod';
import { Channel, invoke } from '@tauri-apps/api/core';

import Toasts from '~/utils/toasts';
import { LocalizedMessage } from '~/utils';

import Preferences from '../stores/preferences';
import { createStore } from '../createStore';
import Context from '../stores/context';
import { fromTocString, path } from '../utils';

import {
	assertNotAborted,
	type AsyncCtx,
	type AvailableAddon,
	fetchAddons
} from './api';
import { type RepositoryInfo } from './ipc';
import FetchCache from '../stores/fetchCache';

const TocArray = z.preprocess(
	v =>
		typeof v === 'string'
			? v
					.split(', ')
					.map(v => v.trim())
					.filter(v => v)
			: v,
	z.array(z.string())
);

export const AddonToc = z
	.object({
		Interface: z.string(),
		Title: z.string(),
		['Title-zhCN']: z.string(),
		['Title-esES']: z.string(),
		['Title-ptPT']: z.string(),
		['Title-deDE']: z.string(),
		['Title-ruRU']: z.string(),
		Author: z.string(),
		Notes: z.string(),
		['Notes-zhCN']: z.string(),
		['Notes-esES']: z.string(),
		['Notes-ptPT']: z.string(),
		['Notes-deDE']: z.string(),
		['Notes-ruRU']: z.string(),
		Version: z.string(),
		Dependencies: TocArray,
		OptionalDeps: TocArray
	})
	.partial();
export type AddonToc = z.infer<typeof AddonToc>;

export const localizedTocField = (
	toc: AddonToc | undefined,
	field: 'Title' | 'Notes',
	lang?: 'zhCN' | 'esES' | 'ptPT' | 'deDE' | 'ruRU'
) =>
	toc?.[`${field}${lang ? (`-${lang}` as const) : ''}`] ??
	toc?.[field] ??
	toc?.[`${field}-zhCN`] ??
	'';

export const AddonDependency = z.discriminatedUnion('status', [
	z.object({
		name: z.string(),
		optional: z.boolean(),
		status: z.enum(['installed', 'downloading', 'missing'])
	}),
	z.object({
		name: z.string(),
		optional: z.boolean(),
		status: z.literal('available'),
		git: z.string(),
		gitRef: z.string().optional()
	})
]);
export type AddonDependency = z.infer<typeof AddonDependency>;

export const AddonData = z.object({
	name: z.string(),
	status: z.enum(['upToDate', 'outOfDate', 'downloading', 'invalid']),
	git: z.string(),
	gitRef: z.string().optional(),
	branches: z.array(z.string()).optional(),
	toc: AddonToc.optional(),
	dependencies: z.array(AddonDependency),
	progress: z.string().optional(),

	error: LocalizedMessage.optional(),
	gitError: z.string().optional(),
	correctName: z.string().optional()
});
export type AddonData = z.infer<typeof AddonData>;

const store = createStore({ schema: z.record(z.string(), AddonData) });
const remote = createStore({ schema: z.array(AddonData), initialValues: [] });

const getGithubFile = async <T>(
	a: Partial<AvailableAddon> | undefined,
	fileName: string,
	transform: (content: string) => T | Promise<T>,
	ctx?: AsyncCtx
) =>
	FetchCache.get({
		key: `git-file:${a?.git}:${fileName}:${a?.gitRef ?? 'HEAD'}`,
		ttl: 24 * 60 * 60,
		revalidate: true,
		// signal: ctx?.signal,
		callback: async () => {
			if (!a?.git) return undefined;
			const r = await fetch(
				`${a.git.replace(/\.git$/, '')}/raw/${a.gitRef ?? 'HEAD'}/${fileName}`,
				ctx
			);
			return r.ok ? r.text().then(transform) : undefined;
		}
	});

const resolveAddonToc = async (name: string, dir: string) => {
	const tocName = (await fs.exists(path.join(dir, `${name}.toc`)))
		? name
		: await fs.readDir(dir).then(d =>
				d
					.filter(d => d.name.endsWith('.toc'))
					.sort((l, r) => l.name.length - r.name.length)[0]
					?.name?.slice(0, -4)
		  );

	return {
		name,
		toc: Addons.parseToc(
			await fs.readTextFile(path.join(dir, `${tocName}.toc`))
		),
		correctName: tocName !== name ? tocName : undefined
	} satisfies Partial<AddonData>;
};

const resolveAddonDependencies = () =>
	store.set(
		Object.fromEntries(
			Object.values(store.get()).map(a => {
				try {
					if (a.status === 'invalid' || !a.toc) return [a.name, a];

					const map =
						(optional: boolean) =>
							(name: string): AddonDependency => {
								const addon = Object.values(store.get()).find(
									a => a.name === name
								);
								const avail = remote.get().find(r => r.name === name);
								if (!addon && avail)
									return { ...avail, optional, status: 'available' };

								return {
									name,
									optional,
									status: !addon
										? 'missing'
										: addon.status === 'downloading'
										? 'downloading'
										: 'installed'
								};
							};

					const dependencies = [
						...(a.toc.Dependencies ?? []).map(map(false)),
						...(a.toc.OptionalDeps ?? []).map(map(true))
					];
					return [a.name, { ...a, dependencies }];
				} catch (e) {
					Toasts.hint(e);
					console.error(`[ADDONS] Failed to verify "${a.name}"`, e);
					return [a.name, invalidAddon(a.name, 'addons.error.failed_verify')];
				}
			})
		)
	);

const setAddon = (addon: AddonData) => store.update({ [addon.name]: addon });
const deleteAddon = (addon: string) =>
	store.set(
		Object.fromEntries(Object.entries(store.get()).filter(([k]) => k !== addon))
	);
const setRemote = (addon: AddonData) =>
	remote.set(remote.get().map(v => (v.git === addon.git ? addon : v)));

const loadRemoteDetails = async (
	addon: Pick<AddonData, 'git' | 'name' | 'gitRef'>
) => {
	const current = remote.get().find(v => v.git === addon.git);
	if (!current || current.status === 'invalid') return;
	const toc = await getGithubFile(
		addon,
		`${addon.name}.toc`,
		Addons.parseToc
	).catch(() => undefined);
	setRemote({ ...current, toc, status: 'upToDate', dependencies: [] });
};

const invalidAddon = (
	name: string,
	error: string,
	values?: Record<string, unknown>
): AddonData => ({
	status: 'invalid',
	error: { id: error, values },
	dependencies: [],
	git: '',
	name
});

const fetchAddonData = async (url: string, ctx?: AsyncCtx) => {
	if (!url.startsWith('http')) return undefined;

	const branch = url.match(/\/tree\/([^/]+)$/)?.[1];
	if (branch) url = url.replace(/\/tree\/[^/]+$/, '');

	if (!url.endsWith('.git')) url += '.git';

	try {
		const response = await fetch(url, ctx);
		if (!response.ok) return undefined;
		return {
			name: url.slice(0, -4).split('/').at(-1) ?? '',
			git: url,
			gitRef: branch
		};
	} catch (e) {
		Toasts.hint(e);
		console.warn(`[ADDONS] Failed to fetch git addon "${url}"`, e);
		return undefined;
	}
};

const verify = async (revalidate = false, ctx?: AsyncCtx) => {
	if (Context.get().addonsState === 'loading') return;
	console.info('[ADDONS] Verifying...');

	const addonsPath = Preferences.pathTo('addons');
	if (!(await fs.exists(addonsPath))) {
		Context.update({ addonsState: 'missing' });
		return;
	}
	Context.update({ addonsState: 'loading' });

	if (!Context.get().offline) {
		const r = await fetchAddons(revalidate, ctx);

		// Filter by region
		const region = Preferences.get().account?.split('@')[1];
		const available = r.filter(a =>
			region === 'SEA' ? a.region === region : !a.region
		);

		// Set remote addons
		remote.set(
			available.map(a => ({
				...a,
				name: a.git.split('/').at(-1)?.slice(0, -4) ?? '',
				status: 'upToDate' as const,
				dependencies: []
			}))
		);
	}

	const localAddons = async () => {
		const dirs = await fs
			.readDir(addonsPath)
			.then(d => d.filter(d => d.isDirectory));

		// First pass to get git status
		const addons = await Promise.all(
			dirs.map(async ({ name }) => {
				try {
					assertNotAborted(ctx);
					const dir = path.join(addonsPath, name);

					// Filter internal addons
					if (await fs.exists(path.join(dir, `${name}.pub`))) return undefined;

					// Check git status
					const { upToDate, ...r } = (await invoke<RepositoryInfo | null>(
						'git_status',
						{ dir }
					).catch(() => null)) ?? { upToDate: true, git: '' };

					return {
						...r,
						status: upToDate ? 'upToDate' : 'outOfDate',
						...(await resolveAddonToc(name, dir)),
						dependencies: []
					} satisfies AddonData;
				} catch (e) {
					Toasts.hint(e);
					console.error(`[ADDONS] Failed to verify "${name}"`, e);
					return invalidAddon(name, 'addons.error.failed_verify');
				}
			})
		).then(r => r.filter(a => a !== undefined));
		store.set(Object.fromEntries(addons.map(a => [a.name, a])));
	};

	await localAddons().finally(() => {
		resolveAddonDependencies();
		// Set state to loaded
		Context.update({ addonsState: 'loaded' });
	});
};

const changeBranch = (name: string, gitRef?: string) => {
	const addon = store.get()[name];
	if (!addon?.git) return;
	setAddon({ ...addon, gitRef });
};

const update = async (...toUpdate: string[]) => {
	const addonsPath = Preferences.pathTo('addons');
	await Promise.allSettled(
		toUpdate.map(async a => {
			const addon = store.get()[a];
			if (!addon || addon.status === 'downloading' || !addon.git) return;
			try {
				const dir = path.join(addonsPath, addon.name);
				setAddon({ ...addon, status: 'downloading' });

				// Update git repository
				await invoke('git_pull', {
					dir,
					branch: addon.gitRef,
					force: true,
					channel: new Channel<number>(p => {
						if (typeof p !== 'number') return;
						setAddon({ ...addon, progress: `${p.toFixed(0)}%` });
					})
				});

				setAddon({
					...addon,
					status: 'upToDate',
					...(await resolveAddonToc(addon.name, dir))
				});
				console.info(`[ADDONS] Updated "${addon.name}"`);
			} catch (e) {
				Toasts.hint(e);
				setAddon({
					...addon,
					status: 'invalid',
					error: { id: 'addons.error.failed_update' }
				});
				console.error(`[ADDONS] Failed to update "${addon.name}"`, e);
			}
		})
	);
	resolveAddonDependencies();
};

const remove = async (...toRemove: string[]) => {
	const addonsPath = Preferences.pathTo('addons');
	for (const name of toRemove) {
		const addon = store.get()[name];
		if (!addon?.name) continue;

		try {
			// Remove git repository
			const dir = path.join(addonsPath, addon.name);
			if (await fs.exists(dir)) await fs.remove(dir, { recursive: true });
			deleteAddon(name);
			console.info(`[ADDONS] Removed "${name}"`);
		} catch (e) {
			Toasts.hint(e);
			console.error(`[ADDONS] Failed to remove "${name}"`, e);
		}
	}
	resolveAddonDependencies();
};

const install = async (addon: AvailableAddon) => {
	const addonsPath = Preferences.pathTo('addons');
	const name = addon.git.split('/').at(-1) ?? '';
	if (!name) return;
	const dir = path.join(addonsPath, name);
	try {
		const prev = {
			...addon,
			name,
			dependencies: [],
			status: 'downloading' as const
		};
		setAddon(prev);

		await invoke('git_clone', {
			dir,
			branch: addon.gitRef,
			url: addon.git,
			onProgress: new Channel<number>(p => {
				if (typeof p !== 'number') return;
				setAddon({ ...prev, progress: `${p.toFixed(0)}%` });
			})
		});

		const installedAddon: AddonData = {
			...prev,
			status: 'upToDate',
			...(await resolveAddonToc(name, dir))
		};
		setAddon(installedAddon);
		await fixName(installedAddon);
		console.info(`[ADDONS] Installed "${name}"`);
	} catch (e) {
		Toasts.hint(e);
		if (await fs.exists(dir)) await fs.remove(dir, { recursive: true });
		setAddon(invalidAddon(name, 'addons.error.failed_install'));
		console.error(`[ADDONS] Failed to install "${name}"`, e);
	}
	resolveAddonDependencies();
};

const fixName = async ({ correctName, ...addon }: AddonData) => {
	if (!correctName) return;

	const addonsDir = Preferences.pathTo('addons');
	const oldDir = path.join(addonsDir, addon.name);
	const newDir = path.join(addonsDir, correctName);

	// Delete old entry
	deleteAddon(addon.name);

	// Remove old dir
	if (
		(await fs.exists(newDir)) &&
		oldDir.toLocaleLowerCase() !== newDir.toLocaleLowerCase()
	)
		await fs.remove(newDir, { recursive: true });

	// Move to proper name
	await fs.rename(oldDir, newDir);

	// Set new name
	setAddon({ ...addon, name: correctName });

	resolveAddonDependencies();
};

const removeGitRemote = async (name: string) => {
	const addon = store.get()[name];
	if (!addon?.git) return;

	const addonsDir = Preferences.pathTo('addons');
	const gitDir = path.join(addonsDir, name, '.git');
	if (await fs.exists(gitDir)) await fs.remove(gitDir, { recursive: true });

	setAddon({ ...addon, git: '', gitError: undefined });
};

const changeGitRemote = async (name: string, newUrl: string) => {
	const addon = store.get()[name];
	if (!addon) return;

	const dir = path.join(Preferences.pathTo('addons'), name);

	try {
		await invoke('git_change_remote', { dir, url: newUrl });

		const r = await invoke<RepositoryInfo | null>('git_status', {
			dir
		}).catch(() => null);

		setAddon({
			...addon,
			...(r ?? {}),
			status: !r || r.upToDate ? 'upToDate' : 'outOfDate'
		});
	} catch (e) {
		Toasts.hint(e);
		console.error(`[ADDONS] Failed to verify "${name}"`, e);
		return invalidAddon(name, 'addons.error.failed_verify');
	}
};

const Addons = {
	...store,
	remote,
	parseToc: (content: string) => AddonToc.parse(fromTocString(content)),
	getGithubFile,
	loadRemoteDetails,
	fetchAddonData,
	verify,
	changeBranch,
	update,
	remove,
	install,
	fixName,
	removeGitRemote,
	changeGitRemote
};

export default Addons;
