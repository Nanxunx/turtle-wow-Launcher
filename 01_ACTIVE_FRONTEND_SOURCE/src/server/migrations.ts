import * as fs from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { ModEntries, Mods } from '~/server/stores/mods';
import Preferences from '~/server/stores/preferences';
import { getAppDataDir, path, toTocString } from '~/server/utils';
import { isVersionHigher } from '../utils';

export const Migrations = [
	async (oldVersion: string) => {
		if (isVersionHigher(oldVersion, '2.3.0')) return;
		console.info('[MIGRATION] From 2.3.0 -> Preferences.serverUrl removed default');
		const { serverUrl } = Preferences.get();
		if (serverUrl !== 'https://launcher.turtle-wow.org') return;
		Preferences.update({ serverUrl: undefined });
	},
	async (oldVersion: string) => {
		if (isVersionHigher(oldVersion, '2.2.7')) return;
		console.info('[MIGRATION] From 2.2.7 -> custom-mpqs.json removal');
		const storePath = path.join(await getAppDataDir(), 'custom-mpqs.json');
		if (!(await fs.exists(storePath))) return;
		const dataDir = Preferences.pathTo('data');
		const parsed = ModEntries.safeParse(await fs.readTextFile(storePath));
		if (parsed.success && (await fs.exists(dataDir))) {
			await Promise.allSettled(Object.entries(parsed.data).map(async ([key, item]) => {
				if (!item?.name) return;
				await invoke('set_mpq_file', {
					path: path.join(dataDir, `${item.enabled ? '' : '_'}patch-${key}.mpq`),
					fileName: 'Patch.toc',
					data: new TextEncoder().encode(toTocString({ Name: item.name }))
				});
			}));
		}
		await fs.remove(storePath);
	},
	async (oldVersion: string) => {
		if (isVersionHigher(oldVersion, '2.2.7')) return;
		console.info('[MIGRATION] From 2.2.7 -> custom-dlls.json removal');
		const storePath = path.join(await getAppDataDir(), 'custom-dlls.json');
		if (!(await fs.exists(storePath))) return;
		const parsed = ModEntries.safeParse(await fs.readTextFile(storePath));
		if (parsed.success) await Promise.allSettled(Object.entries(parsed.data).map(async ([key, item]) => {
			if (!item?.enabled) return;
			await Mods.addCustomDLL(item.name ?? key);
		}));
		await fs.remove(storePath);
	},
	async (oldVersion: string) => {
		if (isVersionHigher(oldVersion, '2.2.7')) return;
		console.info('[MIGRATION] From 2.2.7 -> createStore .bak removal');
		const dataDir = await getAppDataDir();
		const bakFiles = await fs.readDir(dataDir).then(r => r.map(f => f.name).filter(n => n.endsWith('.bak')));
		await Promise.all(bakFiles.map(file => fs.remove(path.join(dataDir, file))));
	},
	async (oldVersion: string) => {
		if (isVersionHigher(oldVersion, '2.3.0-beta8')) return;
		console.info('[MIGRATION] From 2.3.0-beta8 -> default linuxLaunchArgs clear');
		const { linuxLaunchArgs } = Preferences.get();
		if (linuxLaunchArgs !== 'wine $WoW.exe$') return;
		Preferences.update({ linuxLaunchArgs: undefined });
	}
] as const;
