import { ZodError, type z } from 'zod';
import { ask } from '@tauri-apps/plugin-dialog';
import { exit, relaunch } from '@tauri-apps/plugin-process';
import * as fs from '@tauri-apps/plugin-fs';
import { createAtom } from '@xstate/store';
import { useSelector } from '@xstate/store/react';

import { debounce, isDeepEqual } from '~/utils';
import { getAppDataDir, path } from '~/server/utils';

const hasUpdates = <T>(partial: Partial<T>, full: T): boolean => {
	for (const key in partial) {
		if (!isDeepEqual(partial[key as keyof T], full[key as keyof T])) {
			return true;
		}
	}
	return false;
};

const getDefaultInitial = <TShape extends StoreShape>(schema: TShape) => {
	if (schema.safeParse([]).success) return [];
	if (schema.safeParse({}).success) return {};
	throw new Error('Unsupported store schema: must be an object or array');
};

type StoreOutput = Record<string, unknown> | unknown[];
type StoreShape = z.ZodType<StoreOutput>;

export const createStore = <TShape extends StoreShape>({
	schema,
	file,
	initialValues,
	onLoad
}: {
	schema: TShape;
	file?: string;
	initialValues?: Partial<z.infer<TShape>>;
	onLoad?: (v: z.infer<TShape>) => z.infer<TShape> | Promise<z.infer<TShape>>;
}) => {
	const loaded = createAtom(!file);
	const atom = createAtom(
		schema.parse(initialValues ?? getDefaultInitial(schema))
	);

	if (file) {
		const readFromFile = async (p: string): Promise<z.infer<TShape>> => {
			const data = await fs.readTextFile(p);
			return schema.parse(JSON.parse(data));
		};

		(async () => {
			let storePath: string | undefined;
			try {
				storePath = path.join(await getAppDataDir(), file);
				if (!(await fs.exists(storePath))) return;

				let parsed = await readFromFile(storePath);
				if (onLoad) parsed = await onLoad(parsed);
				atom.set(parsed);
			} catch (e) {
				console.error(`[STORE] Failed to load "${file}":`, e);
				if (e instanceof ZodError) console.error(e.issues);

				const reset =
					import.meta.env.MODE !== 'development' ||
					(await ask(
						`Failed to load and parse "${file}". Error: ${e}\n\nYou can either reset the config to default values or quit the application.`,
						{
							title: 'Error loading config',
							okLabel: 'Reset config',
							cancelLabel: 'Quit',
							kind: 'error'
						}
					));

				if (reset) {
					if (storePath) await fs.remove(storePath);
					await relaunch();
				} else {
					await exit();
				}
			} finally {
				loaded.set(true);

				atom.subscribe(
					debounce(async (value: z.infer<TShape>) => {
						try {
							const storePath = path.join(await getAppDataDir(), file);
							const tempPath = `${storePath}.tmp`;

							await fs.writeTextFile(
								tempPath,
								JSON.stringify(value, null, import.meta.env.DEV ? 2 : undefined)
							);

							await fs.rename(tempPath, storePath);
						} catch (e) {
							console.error(`[STORE] Failed to save "${file}":`, e);
						}
					}, 2000)
				);
			}
		})();
	}

	return {
		...atom,
		loaded: () => !!loaded.get(),
		useLoaded: () => useSelector(loaded, s => !!s),
		update: (v: Partial<z.infer<TShape>>) =>
			atom.set(p => (hasUpdates(v, p) ? { ...p, ...v } : p)),
		useWatch: <T extends keyof z.infer<TShape>>(key: T) =>
			useSelector(atom, s => s[key]),
		useSelector: <T>(selector: (snapshot: z.infer<TShape>) => T) =>
			useSelector(atom, selector)
	};
};
