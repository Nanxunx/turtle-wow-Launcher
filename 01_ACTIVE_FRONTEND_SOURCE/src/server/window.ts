import { TrayIcon } from '@tauri-apps/api/tray';
import { Menu } from '@tauri-apps/api/menu';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { BoomBox, Pause, Play, Swords } from 'lucide-react';
import { t } from '~/components/IntlProvider';
import { iconToTauriImage } from '~/utils/iconToTauriImage';
import { Radio } from '~/components/radio/Radio';
import Updater from './modules/updater';
import Preferences from './stores/preferences';
import Context, { TabNames } from './stores/context';
import Patcher from './modules/patcher';

let tray: TrayIcon | null = null;
let menu: Menu | null = null;
const icons = { launch: iconToTauriImage(Swords), play: iconToTauriImage(Play), pause: iconToTauriImage(Pause), radio: iconToTauriImage(BoomBox) };

const Window = {
	clearTray: async () => {
		if (tray) { await tray.close(); tray = null; }
		if (menu) { await menu.close(); menu = null; }
	},
	updateTray: async () => {
		if (!tray || !menu) return;
		const { playing, live } = Radio.get();
		const playButton = await menu.get('play');
		if (playButton && 'setIcon' in playButton) {
			await playButton.setText(t({ id: playing ? 'radio.pause' : 'radio.play' }));
			await playButton.setIcon(playing ? await icons.pause : await icons.play);
		}
		const liveButton = await menu.get('live');
		if (liveButton && 'setChecked' in liveButton) { await liveButton.setChecked(live); await liveButton.setEnabled(!live); }
	},
	getTray: async () => {
		if (tray) return tray;
		const { playing, live, controls } = Radio.get();
		menu = await Menu.new({ items: [
			{ text: t({ id: 'general.launch' }), icon: await icons.launch, action: () => {
				const state = Updater.get().state; const unsavedChanges = Context.get().unsavedChanges; Window.show();
				if (unsavedChanges || !['serverUnreachable', 'upToDate', 'gameRunning'].includes(state)) return;
				Patcher.launchWoW();
			}},
			{ item: 'Separator' },
			...TabNames.map(tab => ({ id: tab, text: t({ id: `header.${tab}` }), action: () => { Context.update({ activeTab: tab }); Window.show(); } })),
			{ item: 'Separator' },
			{ text: t({ id: 'radio.title' }), icon: await icons.radio, enabled: false },
			{ id: 'play', text: t({ id: playing ? 'radio.pause' : 'radio.play' }), icon: await (playing ? icons.pause : icons.play), action: controls?.togglePlay },
			{ id: 'live', text: t({ id: 'radio.live' }), action: controls?.goLive, checked: live, enabled: !live },
			{ item: 'Separator' }, { text: t({ id: 'top_bar.quit' }), action: Window.close }
		]});
		tray = await TrayIcon.new({ icon: await defaultWindowIcon().then(r => r ?? undefined), menu, action: e => e.type === 'Click' && e.button === 'Left' && Window.show(), showMenuOnLeftClick: false });
		tray.setVisible(false);
		return tray;
	},
	hide: async () => {
		if (!Preferences.get().minimizeToTray) return getCurrentWindow().minimize();
		await getCurrentWindow().hide(); (await Window.getTray())?.setVisible(true);
	},
	show: async () => {
		const win = getCurrentWindow();
		if (Preferences.get().minimizeToTray) await win.show(); else await win.unminimize();
		await win.setFocus(); (await Window.getTray())?.setVisible(false);
	},
	close: async () => { await Window.show(); if (Updater.get().progress !== 1) return; await getCurrentWindow().close(); }
};
export default Window;
