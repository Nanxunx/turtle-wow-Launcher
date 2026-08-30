import {
	Eraser,
	FileTerminal,
	MonitorCog,
	NotepadText,
	Settings,
	ShieldCheck
} from 'lucide-react';
import { openPath } from '@tauri-apps/plugin-opener';
import { useRef, useState } from 'react';

import Preferences from '~/server/stores/preferences';
import { Checkbox } from '~/components/form/CheckboxInput';
import Updater from '~/server/modules/updater';
import { useTranslation } from '~/components/IntlProvider';
import FetchCache from '~/server/stores/fetchCache';
import Context from '~/server/stores/context';
import { type LocalizedMessage, TopBarButtonSize } from '~/utils';
import Patcher from '~/server/modules/patcher';
import { getAppDataDir, isLinux, path } from '~/server/utils';

import TextButton from '../styled/TextButton';
import MirrorSelect from '../inputs/MirrorSelect';
import Dialog, { DialogClose } from '../styled/Dialog';

import DeveloperSettingsDialog from './DeveloperSettingsDialog';
import LaunchArgument from './LaunchArgument';
import ClientDirInput from './ClientDirInput';

const PreferencesDialog = () => {
	const t = useTranslation();

	const [open, setOpen] = useState(false);
	const [mirrorError, setMirrorError] = useState<LocalizedMessage>();

	const betaChanged = useRef(false);
	const onOpenChange = (isOpen: boolean) => {
		if (open && !isOpen && betaChanged.current) {
			betaChanged.current = false;
			Updater.verify();
		}
		setOpen(isOpen);
	};

	const firstTimeSetUp = Preferences.useFirstTimeSetUp();
	const isUpdating = Updater.useIsUpdating();
	const isRunning = Updater.useWatch('state') === 'gameRunning';
	const offline = Context.useWatch('offline');

	return (
		<Dialog
			type="controlled"
			open={open}
			onOpenChange={onOpenChange}
			title={t({ id: 'preferences.settings' })}
			trigger={
				<TextButton
					icon={Settings}
					type="submit"
					title={t({ id: 'top_bar.settings' })}
					size={TopBarButtonSize}
					disabled={firstTimeSetUp}
					className="!p-1"
				/>
			}
			noScroll
		>
			<DeveloperSettingsDialog onClose={() => setOpen(false)} />

			<ClientDirInput
				onClose={() => setOpen(false)}
				disabled={isUpdating || isRunning}
			/>

			<MirrorSelect
				value={Preferences.useWatch('mirror') ?? ''}
				onChange={v => Preferences.update({ mirror: v })}
				error={mirrorError}
				setError={setMirrorError}
			/>

			{isLinux && <LaunchArgument onClose={() => setOpen(false)} />}

			<div className="grid grid-cols-2 gap-3">
				<div>
					<h4>{t({ id: 'preferences.troubleshooting' })}</h4>
					<DialogClose>
						<TextButton
							icon={ShieldCheck}
							onClick={() => Updater.verify(true)}
							disabled={firstTimeSetUp || isUpdating || isRunning || offline}
							className="text-green"
						>
							{t({ id: 'preferences.verify' })}
						</TextButton>
					</DialogClose>

					<TextButton
						icon={FileTerminal}
						onClick={async () =>
							openPath(path.join(await getAppDataDir(), 'logs'))
						}
						className="text-orange"
					>
						{t({ id: 'preferences.open_log' })}
					</TextButton>

					<DialogClose>
						<TextButton
							icon={Eraser}
							onClick={() => {
								FetchCache.clear();
								Updater.FileCache.set({});
								Context.softReload();
							}}
							disabled={firstTimeSetUp || isUpdating || offline}
							className="text-orange"
						>
							{t({ id: 'preferences.clear_cache' })}
						</TextButton>
					</DialogClose>

					<DialogClose>
						<TextButton
							icon={NotepadText}
							onClick={() => {
								Preferences.update({ launcherVersion: undefined });
								Context.softReload();
							}}
							disabled={firstTimeSetUp || isUpdating}
						>
							{t({ id: 'preferences.changelog' })}
						</TextButton>
					</DialogClose>

					<DialogClose>
						<TextButton
							icon={MonitorCog}
							onClick={async () => {
								await Patcher.resetConfigSetup();
								Context.softReload();
							}}
							disabled={isUpdating || isRunning}
						>
							{t({ id: 'preferences.reset_preset' })}
						</TextButton>
					</DialogClose>
				</div>

				<div>
					<h4>{t({ id: 'preferences.general_settings' })}</h4>
					<Checkbox
						label={t({ id: 'preferences.clean_wdb' })}
						value={Preferences.useWatch('cleanWdb') ?? false}
						onChange={v => Preferences.update({ cleanWdb: v || undefined })}
						className="self-start"
					/>

					<Checkbox
						label={t({ id: 'preferences.minimize_to_tray' })}
						value={Preferences.useWatch('minimizeToTray') ?? false}
						onChange={v =>
							Preferences.update({ minimizeToTray: v || undefined })
						}
						className="self-start"
					/>

					<Checkbox
						label={t({ id: 'preferences.close_on_launch' })}
						value={Preferences.useWatch('closeOnLaunch') ?? false}
						onChange={v => {
							betaChanged.current = true;
							Preferences.update({ closeOnLaunch: v || undefined });
						}}
						className="self-start"
					/>

					<Checkbox
						label={t({ id: 'preferences.beta_updates' })}
						value={Preferences.useWatch('betaUpdates') ?? false}
						onChange={v => {
							betaChanged.current = true;
							Preferences.update({ betaUpdates: v || undefined });
						}}
						className="self-start"
					/>
				</div>
			</div>
		</Dialog>
	);
};

export default PreferencesDialog;
