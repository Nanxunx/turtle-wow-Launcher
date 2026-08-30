import { Channel, invoke } from '@tauri-apps/api/core';
import * as fs from '@tauri-apps/plugin-fs';
import Toasts from '~/utils/toasts';
import { Wrappers } from '~/components/IntlProvider';
import { formatFileSize } from '~/utils';
import Tweaks, { type TweaksSchema } from '../stores/tweaks';
import Preferences from '../stores/preferences';
import Context from '../stores/context';
import { Mods } from '../stores/mods';
import Window from '../window';
import { isLinux, path } from '../utils';
import { getRegionByName, logActivity } from './api';
import Updater from './updater';
import { getClientVersion } from './ipc';
import Addons from './addons';

type Tweak = { key: keyof TweaksSchema; default?: unknown } & ({ type: 'bytes'; value: (v: unknown) => [number, number[]][]; } | { type: 'int8' | 'uint16' | 'float'; offset: number; value: (v: unknown) => number; });

const binaryEdits = [
	{ key: 'farClip', type: 'float', offset: 0x40fed8, value: v => Number(v) },
	{ key: 'fieldOfView', type: 'float', offset: 0x4089b4, value: v => Number(v ?? 1) * (Math.PI / 180) },
	{ key: 'frillDistance', type: 'float', offset: 0x467958, value: v => Number(v) },
	{ key: 'soundInBackground', type: 'int8', offset: 0x3a4869, value: v => (v ? 0x27 : 0x14) },
	{ key: 'alwaysAutoLoot', type: 'bytes', value: v => [[0x0c1ecf, [v ? 0x75 : 0x74]], [0x0c2b25, [v ? 0x75 : 0x74]]] },
	{ key: 'nameplateRange', type: 'float', offset: 0x40c448, value: v => Number(v) },
	{ key: 'cameraDistance', type: 'float', offset: 0x4089a4, value: v => Number(v) }
] satisfies Tweak[];

const Patcher = {
	patchExecutable: async () => {
		const exePath = Preferences.pathTo('exe');
		if (!(await fs.exists(exePath))) { console.warn(`[PATCHER] WoW.exe not found at "${exePath}"`); Toasts.translated({ id: 'error.missing_executable' }); return; }
		if (await invoke('is_game_running')) { Toasts.translated({ id: 'launch.error_game_running' }); return; }
		try {
			const buffer = await fs.readFile(exePath); const view = new DataView(buffer.buffer); const appliedTweaks: Record<string, unknown> = {};
			binaryEdits.forEach(t => {
				const val = Tweaks.get()[t.key]; appliedTweaks[t.key] = val;
				if (t.type === 'float') view.setFloat32(t.offset, t.value(val), true);
				else if (t.type === 'int8') view.setInt8(t.offset, t.value(val));
				else if (t.type === 'bytes') t.value(val).forEach(([offset, bytes]) => bytes.map((b, i) => view.setUint8(offset + i, b)));
			});
			await fs.writeFile(exePath, buffer);
			console.info('[PATCHER] Applied tweaks:', Object.entries(appliedTweaks).map(([k, v]) => `${k}=${v}`).join(' '));
		} catch (e) { console.error('[PATCHER] Failed to apply tweaks', e); const [_, handled] = Toasts.hint(e); if (!handled) Toasts.exception(e); }
	},
	launchWoW: async () => {
		if (Updater.get().state === 'updateAvailable') { Toasts.translated({ id: 'error.update_pending' }); return; }
		const { cleanWdb, linuxLaunchArgs } = Preferences.get(); const exePath = Preferences.pathTo('exe');
		if (isLinux && !linuxLaunchArgs) { Toasts.translated({ id: 'error.missing_linux_launch_args' }); return; }
		try {
			console.info(`[PATCHER] Running ${Context.get().buildVersion ?? 'unknown'} ${Preferences.get().language.toUpperCase()} at "${exePath}"...`); Context.update({ launching: true });
			if (!(await fs.exists(exePath))) { console.error('[PATCHER] WoW.exe not found'); Toasts.translated({ id: 'error.missing_executable' }); return; }
			if (cleanWdb && !(await Patcher.cleanWdb())) { Toasts.translated({ id: 'error.launch_failed' }); return; }
			const addons = Object.entries(Addons.get()); console.info(`[PATCHER] Addon count: ${addons.length}`);
			const dataPath = Preferences.pathTo('data');
			const mpqs = await Promise.all(await Mods.getCustomMPQs().then(async mpqList => mpqList.filter(v => v.enabled).map(async ({ key, toc, name }) => {
				const mpqPath = path.join(dataPath, name); if (!(await fs.exists(mpqPath))) { console.error(`[PATCHER] MPQ not found: ${mpqPath}`); return 'ERROR_NOT_FOUND'; }
				const { mtime, size } = await fs.lstat(mpqPath); const ver = toc?.Version ? ` v${toc.Version}` : ''; const title = toc?.Title ? ` - ${toc.Title}` : ''; const meta = !title ? ` (${mtime?.toDateString()}, ${formatFileSize(size)})` : ''; return `Patch-${key}.mpq${ver}${title}${meta}`;
			}))).then(v => v.join(', ')); if (mpqs) console.info(`[PATCHER] Custom MPQs: ${mpqs}`);
			const dlls = await Promise.all(await Mods.getCustomDLLs().then(async dllList => dllList.map(async ({ name, enabled, remote }) => { if (!enabled) return undefined; if (remote) return `${remote.mod} ${remote.version}`; return name; }))).then(v => v.filter(v => v).join(', ')); if (dlls) console.info(`[PATCHER] Custom DLLs: ${dlls}`);
			const [linuxCommand, ...linuxArgs] = (linuxLaunchArgs ?? '').split(' ').map(v => v.trim()).map(v => v.replace('$WoW.exe$', exePath));
			const channel = new Channel<number>(async code => {
				console.info(`[PATCHER] WoW stopped with exit code ${code}`); await Window.show();
				const dxvkLogPath = path.join(Preferences.clientDir(), 'WoW_d3d9.log'); const dxvkLog = (await fs.exists(dxvkLogPath)) ? await fs.readTextFile(dxvkLogPath) : ''; const dxvkCrash = dxvkLog && !dxvkLog.includes('info:  Vulkan: Found vkGetInstanceProcAddr in');
				if (dxvkCrash) { console.warn('[PATCHER] Detected DXVK crash, disabling the mod.'); await Mods.removeCustomDLL('dxvk'); Toasts.translated({ id: 'error.dxvk_crash' }); }
				Updater.verify(); const oneMinuteAgo = Date.now() - 60 * 1000; const errorsDir = path.join(Preferences.clientDir(), 'Errors'); if (!(await fs.exists(errorsDir))) return; const logFiles = await fs.readDir(errorsDir);
				const latestLog = logFiles.filter(f => f.isFile && f.name.endsWith('.txt')).map(f => { const m = f.name.match(/^(\d+)-(\d+)-(\d+) (\d+).(\d+).(\d+)/)?.slice(1).map(n => Number(n)); if (!m) return undefined; return [f.name, new Date(`${m[0]}-${m[1]}-${m[2]} ${m[3]}:${m[4]}:${m[5]}`)] as const; }).filter(v => v !== undefined && v[1].getTime() > oneMinuteAgo)[0]; if (!latestLog) return;
				if (!dxvkCrash && (mpqs || dlls)) Toasts.translated({ id: 'error.game_crashed_with_mods', values: { strong: Wrappers.strong } });
				const logFile = await fs.readTextFile(path.join(errorsDir, latestLog[0])); logActivity('game_crashed', logFile, true);
			});
			await invoke('run_detached', !isLinux ? { program: exePath, workingDir: Preferences.clientDir(), args: [], channel } : { program: linuxCommand, workingDir: Preferences.clientDir(), args: linuxArgs, channel });
			if (Preferences.get().closeOnLaunch) Window.close(); else { Window.hide(); Updater.gameLaunched(); }
		} catch (e) {
			console.error('[PATCHER] Failed to start WoW.exe', e); const [errCode, handled] = Toasts.hint(e); if (!handled) Toasts.exception(e); if (errCode === 193) await fs.remove(exePath); Toasts.translated({ id: e instanceof Error && e.message.includes('EACCES') ? 'error.launch_perm_issue' : 'error.launch_failed' });
		} finally { Context.update({ launching: false }); }
	},
	fromWtfFormat: (raw: string) => Object.fromEntries(raw.split('\n').map(l => { const [_, k, v] = l.match(/SET (\w+) "(.+)"/) ?? []; return !k || !v ? undefined : ([k, v] as const); }).filter(v => v !== undefined)),
	toWtfFormat: (parsed: Record<string, unknown>) => Object.entries(parsed).filter(v => v[1] !== undefined && v[1] !== null).map(l => `SET ${l[0]} "${l[1]}"`).join('\n'),
	patchConfig: async (realmList?: string, defaults: Record<string, unknown> = {}) => {
		const configPath = Preferences.pathTo('config');
		try {
			const wtfPath = path.dirname(configPath); if (!(await fs.exists(wtfPath))) await fs.mkdir(wtfPath, { recursive: true }); const raw = (await fs.exists(configPath)) ? await fs.readTextFile(configPath) : ''; const old = Patcher.fromWtfFormat(raw);
			const parsed = { ...old, ...defaults, CameraDistanceMax: Tweaks.get().cameraDistance, farClip: Tweaks.get().farClip, ...(old.violenceLevel === '0' ? { violenceLevel: undefined } : {}), ...(realmList ? { realmList, patchList: realmList } : {}), scriptMemory: 0, hwDetect: 0, M2UseShaders: 1, M2Faster: 0, checkAddonVersion: 0 };
			await fs.writeTextFile(configPath, Patcher.toWtfFormat(parsed)); console.info('[PATCHER] Config.wtf successfully patched');
		} catch (e) { console.error('[PATCHER] Failed to patch config.wtf:', e); const [_, handled] = Toasts.hint(e); if (!handled) Toasts.exception(e); }
	},
	patchRealmList: async (realmList?: string) => { if (!realmList) { console.warn('[PATCHER] No realm list provided!'); return; } try { const realmListPath = Preferences.pathTo('realmList'); await fs.writeTextFile(realmListPath, Patcher.toWtfFormat({ realmList, patchList: realmList })); console.info(`[PATCHER] Realm list set to "${realmList}"`); } catch (e) { console.error('[PATCHER] Failed to write realmlist.wtf:', e); const [_, handled] = Toasts.hint(e); if (!handled) Toasts.exception(e); } },
	needsConfigSetup: async () => { const configPath = Preferences.pathTo('config'); const raw = (await fs.exists(configPath)) ? await fs.readTextFile(configPath) : ''; const configWtf = Object.fromEntries(raw.split('\n').map(l => { const [_, k, v] = l.match(/SET (\w+) "(.+)"/) ?? []; return !k || !v ? undefined : ([k, v] as const); }).filter(v => v !== undefined)); return !configWtf.turtleWoW; },
	resetConfigSetup: async () => { const configPath = Preferences.pathTo('config'); const raw = (await fs.exists(configPath)) ? await fs.readTextFile(configPath) : ''; const { turtleWoW: _, ...configWtf } = Object.fromEntries(raw.split('\n').map(l => { const [_, k, v] = l.match(/SET (\w+) "(.+)"/) ?? []; return !k || !v ? undefined : ([k, v] as const); }).filter(v => v !== undefined)); await fs.writeTextFile(configPath, Object.entries(configWtf).filter(v => v[1] !== undefined && v[1] !== null).map(l => `SET ${l[0]} "${l[1]}"`).join('\n')); console.info('[PATCHER] Config preset selection reset'); },
	applyAll: async () => { const [region, ver] = await Promise.all([getRegionByName(), getClientVersion()]); if (!ver) { console.warn('[PATCHER] WoW.exe not found, patcher changes not applied'); Context.update({ buildVersion: undefined }); return; } console.info(`[PATCHER] Client version: ${ver.version} (${ver.build})`); Context.update({ buildVersion: `${ver.version} (${ver.build})` }); await Promise.all([Patcher.patchRealmList(region?.realmList), Patcher.patchExecutable().then(() => Patcher.patchConfig(region?.realmList))]); },
	cleanWdb: async () => { const wdbPath = Preferences.pathTo('wdb'); try { if (await fs.exists(wdbPath)) { console.info(`[PATCHER] Cleaning up WDB at "${wdbPath}"...`); await fs.remove(wdbPath, { recursive: true }); } return true; } catch (e) { console.error('[PATCHER] Failed to remove WDB:', e); const [_, handled] = Toasts.hint(e); if (!handled) Toasts.exception(e); return false; } }
};

export default Patcher;
