import { z } from 'zod';
import * as fs from '@tauri-apps/plugin-fs';

import { createStore } from '../createStore';

import Preferences from './preferences';

export const TabNames = [
	'news',
	'tweaks',
	'addons',
	'mods'
	// TODO: 'profiles'
] as const;

export const ContextSchema = z.object({
	unsavedChanges: z.boolean().optional(),
	activeTab: z.enum(TabNames).default('news'),
	addonsState: z.enum(['loading', 'loaded', 'missing']).default('missing'),
	hasDataDir: z.boolean().default(false),
	buildVersion: z.string().optional(),
	launching: z.boolean().optional(),
	offline: z.boolean().optional(),
	buildingPatches: z.record(z.string(), z.boolean()).default({}),
	softReload: z.number().default(() => Date.now()),
	fallbackDir: z.string().optional()
});
export type ContextSchema = z.infer<typeof ContextSchema>;

const store = createStore({ schema: ContextSchema });

const Context = {
	...store,
	softReload: () => store.set(ContextSchema.parse({})),
	checkDataDir: async () => {
		const dataDir = Preferences.pathTo('data');
		Context.update({ hasDataDir: await fs.exists(dataDir) });
	}
};

export default Context;
