import { z } from 'zod';
import * as fs from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';

import { createStore } from '../createStore';
import { fromTocString, getMpqName, path } from '../utils';
import { fetchManifest, fetchModsManifest } from '../modules/api';

import Preferences from './preferences';

export const ModEntries = z.record(
	z.string(),
	z
		.object({
			enabled: z.boolean(),
			name: z.string().optional(),
			url: z.string().optional(),
			version: z.string().optional(),
			newVersion: z.string().optional()
		})
		.nullable()
);
export type ModEntries = z.infer<typeof ModEntries>;

const getCustomDLLs = async () => {
	const dllsPath = Preferences.pathTo('dlls');

	const [dllsTxt, manifest, modsManifest, clientFiles] = await Promise.all([
		fs
			.exists(dllsPath)
			.then(exists => (exists ? fs.readTextFile(dllsPath) : '')),
		fetchManifest(),
		fetchModsManifest(),
		fs.readDir(Preferences.clientDir())
	]);

	const enabled = dllsTxt
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.length);

	const remote =
		modsManifest?.map(m => {
			const name =
				m.files.find(f => f.tags?.includes('loadDll'))?.name ?? m.mod;
			return {
				name: m.mod,
				enabled: enabled.includes(name),
				remote: m
			};
		}) ?? [];

	const custom = clientFiles
		.filter(
			f =>
				f.name.toLowerCase().endsWith('.dll') &&
				!manifest?.client?.find(m => m.name === f.name) &&
				modsManifest?.every(m => !m.files?.find(m => m.name === f.name))
		)
		.map(f => ({
			name: f.name,
			enabled: enabled.includes(f.name),
			remote: undefined
		}));

	return [...remote, ...custom];
};

export type CustomDLL = Awaited<ReturnType<typeof getCustomDLLs>>[number];

const getCustomMPQs = async () => {
	const dataDir = Preferences.pathTo('data');
	if (!(await fs.exists(dataDir))) return [];

	const mpqs = await fs.readDir(dataDir).then(e =>
		e.reduce((acc, f) => {
			const mpq = getMpqName(f.name);
			if (!mpq || !mpq.key.match(/^[A-Y]$/)) return acc;
			const duplicate = acc.findIndex(m => m?.key === mpq.key);
			if (duplicate !== -1) return acc;
			acc.push(mpq);
			return acc;
		}, [] as Exclude<ReturnType<typeof getMpqName>, undefined>[])
	);
	return Promise.all(
		mpqs.map(async mpq => {
			const data = await invoke<number[] | undefined>('get_mpq_file', {
				path: path.join(dataDir, mpq.name),
				fileName: 'Patch.toc'
			}).catch(() => undefined);

			const toc = data
				? fromTocString(new TextDecoder().decode(new Uint8Array(data)))
				: undefined;

			return { ...mpq, toc };
		})
	).then(r => r.sort((a, b) => a.key.localeCompare(b.key)));
};

export type CustomMPQ = Awaited<ReturnType<typeof getCustomMPQs>>[number];

export const DevMPQs = createStore({
	schema: ModEntries,
	file: 'dev-mpqs.json'
});

const getDevMPQs = async () => {
	const dataDir = Preferences.pathTo('data');
	const allFiles = await fs
		.exists(dataDir)
		.then(e => (e ? fs.readDir(dataDir) : []));

	const automatic = allFiles.map(f => {
		if (!f.isDirectory) return null;

		const name = f.name.match(/^patch-(.)$/i)?.[1];
		if (!name) return null;

		const folder = path.join(dataDir, f.name);
		if (DevMPQs.get()[folder]) return null;

		return { folder, name, override: false, auto: true };
	});

	const saved = Object.entries(DevMPQs.get()).map(([folder, v]) =>
		v ? { folder, name: v.name ?? '', override: v.enabled, auto: false } : null
	);

	return [...automatic, ...saved]
		.filter(e => e !== null)
		.sort((l, r) => l.name.localeCompare(r.name));
};

export type DevMPQ = Awaited<ReturnType<typeof getDevMPQs>>[number];

export const Mods = {
	getCustomDLLs,
	addCustomDLL: async (dll: string) => {
		const dllsPath = Preferences.pathTo('dlls');
		const txt = (await fs.exists(dllsPath))
			? await fs.readTextFile(dllsPath)
			: '';
		if (txt.includes(dll)) return;
		await fs.writeTextFile(
			dllsPath,
			`${txt}${txt.endsWith('\n') || txt.length === 0 ? '' : '\n'}${dll}\n`
		);
	},
	removeCustomDLL: async (dll: string) => {
		const dllsPath = Preferences.pathTo('dlls');
		if (!(await fs.exists(dllsPath))) return;
		const txt = await fs.readTextFile(dllsPath);
		if (!txt.includes(dll)) return;
		await fs.writeTextFile(
			dllsPath,
			txt
				.split('\n')
				.map(line => line.trim())
				.filter(line => line.length && line !== dll)
				.join('\n')
		);
	},
	getCustomMPQs,
	getDevMPQs,
	addDevMPQ: async (mpq: DevMPQ) => {
		DevMPQs.update({ [mpq.folder]: { name: mpq.name, enabled: mpq.override } });
	},
	removeDevMPQ: (folder: string) => {
		const { [folder]: toRemove, ...newDev } = DevMPQs.get();
		if (!toRemove) return;
		DevMPQs.set(newDev);
	}
};
