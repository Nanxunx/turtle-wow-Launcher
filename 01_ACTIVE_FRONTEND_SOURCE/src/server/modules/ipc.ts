import { invoke } from '@tauri-apps/api/core';
import Toasts from '~/utils/toasts';
import { path } from '~/server/utils';
import Preferences from '../stores/preferences';

export const getAvailableDiskSpace = async () => {
	try {
		return await invoke<number | null>('available_space', { path: Preferences.clientDir().split(path.delimiter())[0] });
	} catch (e) {
		Toasts.hint(e);
		console.error('[IPC] Failed to get available disk space:', e);
		return null;
	}
};

export const getClientVersion = async () => {
	try {
		const r = await invoke<[string, string] | null>('client_version', { path: Preferences.pathTo('exe') });
		return !r ? null : { version: r[0], build: r[1] };
	} catch (e) {
		Toasts.hint(e);
		console.error('[IPC] Failed to get client version:', e);
		return null;
	}
};

export type RepositoryInfo = {
	git: string;
	gitRef: string;
	upToDate: boolean;
	branches: string[];
	changes: Record<string, 'conflicted' | 'untracked' | 'modified' | 'deleted' | 'renamed' | 'other'>;
	gitError?: string;
};
