import { app } from '@tauri-apps/api';
import * as fs from '@tauri-apps/plugin-fs';
import { invoke } from '@tauri-apps/api/core';
import { homeDir } from '@tauri-apps/api/path';

import Navigation from './layout/Navigation';
import LaunchPanel from './layout/LaunchPanel';
import TabsPanel from './layout/TabsPanel';
import SignInPanel from './components/auth/SignInPanel';
import ErrorBoundary from './components/errors/ErrorBoundary';
import FirstTimeSetUp from './components/screens/FirstTimeSetUp';
import Preferences, { DefaultServerUrl } from './server/stores/preferences';
import useQuery from './utils/useQuery';
import WhatsNew from './components/screens/WhatsNew';
import ErrorScreen from './components/errors/ErrorScreen';
import { assertNotAborted, fetchMirrors, fetchRegions, fetchVersions, logActivity } from './server/modules/api';
import Loading from './components/screens/Loading';
import Context from './server/stores/context';
import Updater from './server/modules/updater';
import Addons from './server/modules/addons';
import { formatMessage } from './server/setup';
import Patcher from './server/modules/patcher';
import ConfigSettings from './components/screens/ConfigSetUp';
import { Migrations } from './server/migrations';
import Auth from './server/stores/auth';
import LinuxSetUp from './components/screens/LinuxSetUp';
import { isLinux, path } from './server/utils';

const initContext = async () => {
	const fallbackDir = (await invoke<string>('get_default_dir')) || path.join(await homeDir(), 'Games', 'TurtleWoW');
	Context.update({ fallbackDir });
	const clientDir = Preferences.clientDir();
	Preferences.update({ clientDir: clientDir === fallbackDir ? undefined : clientDir });
	if (Preferences.get().serverUrl === DefaultServerUrl) Preferences.update({ serverUrl: undefined });
	if (!(await fs.exists(clientDir))) await fs.mkdir(clientDir, { recursive: true });
	await Context.checkDataDir();
};

const getRegionByLang = (language: string, regions: { name: string }[]) => {
	if (language === 'cn') {
		const seaRegion = regions.find(r => r.name === 'SEA');
		if (seaRegion) return seaRegion.name;
	} else if (language === 'pt' || language === 'es') {
		const saRegion = regions.find(r => r.name === 'SA');
		if (saRegion) return saRegion.name;
	}
	return regions[0].name;
};

const App = () => {
	const softReload = Context.useWatch('softReload');
	const appInfo = useQuery({
		args: [softReload],
		query: async (_, ctx) => {
			await initContext();
			assertNotAborted(ctx);
			if (!Preferences.get().mirror) return <FirstTimeSetUp />;
			if (isLinux && !Preferences.get().linuxLaunchArgs) return <LinuxSetUp />;
			if (await Patcher.needsConfigSetup()) return <ConfigSettings />;
			const launcherVersion = Preferences.get().launcherVersion;
			if (launcherVersion !== (await app.getVersion())) {
				if (launcherVersion) await Promise.all(Migrations.map(f => f(launcherVersion)));
				return <WhatsNew oldVersion={launcherVersion} />;
			}
			console.info(`[SETUP] Launching client at "${Preferences.clientDir()}"`);
			const mirrors = await fetchMirrors(false, ctx);
			const [regions, versions] = await Promise.all([fetchRegions(false, ctx), fetchVersions(false, ctx)]);
			if (Context.get().offline) {
				console.info('[SETUP] Server unreachable, going offline');
				await Patcher.applyAll();
				assertNotAborted(ctx);
				Updater.verify(false, ctx);
				Addons.verify(false, ctx);
				return <><Navigation /><TabsPanel /><LaunchPanel /></>;
			}
			if (mirrors.ok && !mirrors.data.find(m => m.key === Preferences.get().mirror)) {
				console.warn(`[SETUP] Mirror "${Preferences.get().mirror}" not found, resetting to default mirror`);
				await fetchMirrors(true, ctx);
				Preferences.update({ mirror: mirrors.data[0].key });
			}
			const account = await Auth.authenticate();
			if (regions.ok && !regions.data.find(r => r.name === account?.split('@')[1])) {
				console.warn(`[SETUP] Region "${account?.split('@')[1]}" not found, resetting account`);
				await fetchRegions(true, ctx);
				Preferences.update({ account: undefined });
			}
			if (versions.ok && Preferences.get().version && !versions.data.find(v => v === Preferences.get().version)) {
				console.warn(`[SETUP] Version "${Preferences.get().version}" not found, resetting version`);
				await fetchVersions(true, ctx);
				Preferences.update({ version: undefined });
			}
			if (!regions.ok) return <SignInPanel region="" />;
			const regionName = Preferences.get().account?.split('@')[1];
			if (!regionName) return <SignInPanel region={getRegionByLang(Preferences.get().language, regions.data)} />;
			await Patcher.applyAll();
			assertNotAborted(ctx);
			Updater.verify(false, ctx);
			Addons.verify(false, ctx);
			return <><Navigation /><TabsPanel /><LaunchPanel /></>;
		},
		onError: error => {
			console.error('[SETUP] Error during app initialization:', error);
			logActivity('crash', formatMessage(error), true);
		}
	});
	return <ErrorBoundary>{appInfo.error ? <ErrorScreen error={appInfo.error} /> : appInfo.loading || !appInfo.data ? <Loading /> : appInfo.data}</ErrorBoundary>;
};

export default App;
