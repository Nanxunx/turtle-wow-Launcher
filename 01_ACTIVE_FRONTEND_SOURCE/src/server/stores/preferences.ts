import { z } from 'zod';

import { createStore } from '../createStore';
import { path } from '../utils';

import Context from './context';

export const DefaultServerUrl = 'https://launcher.turtlecraft.gg';

export const PreferencesSchema = z.object({
	serverUrl: z.string().optional(),
	language: z.string().default('en'),
	launcherVersion: z.string().optional(),

	clientDir: z.string().optional(),
	safeDir: z.string().optional(),

	mirror: z.string().optional(),
	version: z.string().optional(),
	account: z.string().optional(),
	savedAccounts: z.array(z.string()).default([]),

	cleanWdb: z.boolean().optional(),
	devSecret: z.string().optional(),
	unpublishedChanges: z.boolean().optional(),
	betaUpdates: z.boolean().optional(),
	openInCodeButton: z.boolean().optional(),
	minimizeToTray: z.boolean().optional(),
	closeOnLaunch: z.boolean().optional(),

	radioVolume: z.number().min(0).max(1).default(0.5),

	linuxLaunchArgs: z.string().optional(),

	ignoredAddonUpdates: z.array(z.string()).default([]),
	ignoredModUpdates: z.array(z.string()).default([]),
	lastActivityLogTime: z.record(z.string(), z.number()).default({})
});
export type PreferencesSchema = z.infer<typeof PreferencesSchema>;

const store = createStore({
	schema: PreferencesSchema,
	file: 'preferences.json'
});

const Preferences = {
	...store,
	serverUrl: () => store.get().serverUrl ?? DefaultServerUrl,
	clientDir: () => {
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		const dir = store.get().clientDir?.trim() || Context.get().fallbackDir;
		if (!dir) throw new Error('Client directory is not set');
		return dir;
	},
	pathTo: (
		file:
			| 'exe'
			| 'wdb'
			| 'addons'
			| 'config'
			| 'realmList'
			| 'accounts'
			| 'data'
			| 'monitorSettings'
			| 'dlls'
	) => {
		switch (file) {
			case 'exe':
				return path.join(Preferences.clientDir(), 'WoW.exe');
			case 'wdb':
				return path.join(Preferences.clientDir(), 'WDB');
			case 'addons':
				return path.join(Preferences.clientDir(), 'Interface', 'AddOns');
			case 'config':
				return path.join(Preferences.clientDir(), 'WTF', 'Config.wtf');
			case 'realmList':
				return path.join(Preferences.clientDir(), 'realmlist.wtf');
			case 'accounts':
				return path.join(Preferences.clientDir(), 'WTF', 'Account');
			case 'data':
				return path.join(Preferences.clientDir(), 'Data');
			case 'monitorSettings':
				return path.join(
					Preferences.clientDir(),
					'VMMFix_preferred_monitor.txt'
				);
			case 'dlls':
				return path.join(Preferences.clientDir(), 'dlls.txt');
		}
	},
	fileCachePath: (name?: string) =>
		path.join(
			...[
				Preferences.clientDir(),
				'Cache',
				name ? `${name}.cached` : undefined
			].filter(v => v !== undefined)
		),
	useFirstTimeSetUp: () => store.useSelector(s => !s.mirror)
};

export default Preferences;
