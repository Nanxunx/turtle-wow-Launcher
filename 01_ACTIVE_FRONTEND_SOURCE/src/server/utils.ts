import { platform } from '@tauri-apps/plugin-os';
import * as fs from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';

import { formatDuration, type FileManifest } from '~/utils';

import Preferences from './stores/preferences';

export const isLinux = platform() === 'linux';

let appDataDirPromise: Promise<string> | undefined;
export const getAppDataDir = () => {
	if (!appDataDirPromise) appDataDirPromise = appDataDir();
	return appDataDirPromise;
};

const trimLeadingSlashes = (v: string) => v.replace(/^[\\/]+/, '');
const trimTrailingSlashes = (v: string) => v.replace(/[\\/]+$/, '');

// Tauri-compatible path facade used to avoid async bridge overhead for hot paths.
export const path = {
	join: (...parts: (string | undefined)[]) => {
		const defined = parts.filter(
			(v): v is string => v !== undefined && v !== ''
		);
		if (!defined.length) return '';

		const separator = defined[0].includes('\\') ? '\\' : '/';
		let result = defined[0];

		for (let i = 1; i < defined.length; i++) {
			result = `${trimTrailingSlashes(result)}${separator}${trimLeadingSlashes(
				defined[i]
			)}`;
		}

		return result;
	},
	dirname: (fullPath: string) => {
		const trimmed = trimTrailingSlashes(fullPath);
		const lastSlash = Math.max(
			trimmed.lastIndexOf('/'),
			trimmed.lastIndexOf('\\')
		);
		if (lastSlash < 0) return '.';
		if (lastSlash === 0) return trimmed[0];
		if (lastSlash === 2 && trimmed[1] === ':')
			return `${trimmed.slice(0, 2)}\\`;
		return trimmed.slice(0, lastSlash);
	},
	basename: (fullPath: string) => {
		const trimmed = trimTrailingSlashes(fullPath);
		const lastSlash = Math.max(
			trimmed.lastIndexOf('/'),
			trimmed.lastIndexOf('\\')
		);
		return lastSlash < 0 ? trimmed : trimmed.slice(lastSlash + 1);
	},
	delimiter: () => (isLinux ? ':' : ';')
};

export const getBuildTarget = () => (isLinux ? 'AppImage' : 'exe');

export const isPathTooLong = () => {
	const maxPathLength = isLinux ? 4000 : 220;
	return Preferences.clientDir().length > maxPathLength;
};

export const getMpqName = (name: string) => {
	const match = name.match(/^(_)?patch-(.)\.mpq$/i);
	if (!match) return undefined;
	return { key: match[2].toLocaleUpperCase(), enabled: !match[1], name };
};

export const fromTocString = (content: string) =>
	content
		.split('\n')
		.filter(l => l.startsWith('## '))
		.map(l => l.slice(3))
		.map(l => {
			const [key, ...value] = l.split(':');
			return [key?.trim(), value.join(':').trim()];
		})
		.reduce(
			(acc, [key, value]) => ({ ...acc, [key]: value }),
			{} as Record<string, string>
		);

export const toTocString = (data: Record<string, string>) =>
	`${Object.entries(data)
		.map(([key, value]) => `## ${key}: ${value}`)
		.join('\n')}\n`;

export const getManifestSize = (m: FileManifest[]) =>
	m.reduce((acc, f) => acc + (f?.size ?? 0), 0);

export const someAsync = async <T>(
	arr: T[],
	cb: (item: T) => Promise<boolean>
) => {
	for (const item of arr) if (await cb(item)) return true;
	return false;
};

export const copyDir = async (sourceDir: string, destDir: string) => {
	if (sourceDir === destDir) return;
	if (!(await fs.exists(sourceDir))) {
		console.error(
			'[COPY_DIR] Tried to copy from a non-existent source directory',
			sourceDir,
			destDir
		);
		return;
	}

	if (destDir.includes(sourceDir)) {
		console.error(
			'[COPY_DIR] Destination directory is inside source directory',
			sourceDir,
			destDir
		);
		return;
	}

	if (!(await fs.exists(destDir))) await fs.mkdir(destDir, { recursive: true });

	const entries = await fs.readDir(sourceDir);
	await Promise.all(
		entries.map(async e => {
			const srcPath = path.join(sourceDir, e.name);
			const destPath = path.join(destDir, e.name);

			if (e.isDirectory) await copyDir(srcPath, destPath);
			else await fs.copyFile(srcPath, destPath);
		})
	);
};

export const safeRename = async (source: string, dest: string) => {
	// Just rename if same drive or not windows
	if (isLinux || source.startsWith(dest.slice(0, 3)))
		return fs.rename(source, dest);

	// Copy and delete otherwise
	await fs.copyFile(source, dest);
	await fs.remove(source);
};

const DEFAULT_CHUNK_CONCURRENCY = (() => {
	const cores =
		typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;
	return Math.max(2, Math.min(6, Math.floor(cores / 2)));
})();

const toIterator = <T>(iterable: Iterable<T> | AsyncIterable<T>) => {
	const isAsyncIterable =
		typeof (iterable as AsyncIterable<T>)[Symbol.asyncIterator] === 'function';
	return isAsyncIterable
		? (iterable as AsyncIterable<T>)[Symbol.asyncIterator]()
		: (iterable as Iterable<T>)[Symbol.iterator]();
};

type ChunkSource<T = unknown> = Iterable<T> | AsyncIterable<T>;

type ChunkValue<TChunks extends ChunkSource> = TChunks extends AsyncIterable<
	infer T
>
	? T
	: TChunks extends Iterable<infer T>
	? T
	: never;

type ChunkTaskTuple<TChunks extends ChunkSource = ChunkSource> = {
	chunks: TChunks;
	cb: (v: ChunkValue<TChunks>, idx: number) => Promise<void>;
};

export async function processInChunks<
	const TChunks extends readonly ChunkSource[]
>(
	tasks: { [K in keyof TChunks]: ChunkTaskTuple<TChunks[K]> },
	chunkSize?: number
): Promise<void>;

export async function processInChunks(
	tasks: ChunkTaskTuple[],
	chunkSize = DEFAULT_CHUNK_CONCURRENCY
) {
	if (chunkSize < 1) {
		throw new Error('processInChunks requires chunkSize >= 1');
	}

	const taskState = tasks.map(({ chunks, cb }) => ({
		iterator: toIterator(chunks),
		cb,
		index: 0,
		done: false,
		result: [] as unknown[]
	}));

	let remainingTasks = taskState.length;
	let roundRobinCursor = 0;
	let nextItem = Promise.resolve<void>(undefined);

	const getNext = async () => {
		const current = nextItem.then(async () => {
			if (remainingTasks < 1) return { done: true as const };

			for (let tries = 0; tries < taskState.length; tries++) {
				const taskIdx = (roundRobinCursor + tries) % taskState.length;
				const task = taskState[taskIdx];
				if (task.done) continue;

				const nextResult = await task.iterator.next();
				if (nextResult.done) {
					task.done = true;
					remainingTasks--;
					continue;
				}

				const index = task.index++;
				roundRobinCursor = (taskIdx + 1) % taskState.length;
				return {
					done: false as const,
					taskIdx,
					value: nextResult.value,
					index
				};
			}

			return { done: true as const };
		});

		nextItem = current.then(() => undefined);
		return current;
	};

	const worker = async () => {
		while (true) {
			const nextResult = await getNext();
			if (nextResult.done) return;

			const task = taskState[nextResult.taskIdx];
			task.result[nextResult.index] = await task.cb(
				nextResult.value,
				nextResult.index
			);
		}
	};

	await Promise.all(Array.from({ length: chunkSize }, () => worker()));
}

export const createTimer = (name: string) => {
	const start = Date.now();
	return () =>
		console.debug(
			`[TIMER] ${name} took ${formatDuration((Date.now() - start) / 1000)}`
		);
};
