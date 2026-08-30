import {
	Check,
	Eye,
	EyeOff,
	Turtle,
	Clipboard,
	TriangleAlert
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import Preferences, { DefaultServerUrl } from '~/server/stores/preferences';
import Input from '~/components/form/Input';
import { useTranslation } from '~/components/IntlProvider';
import FetchCache from '~/server/stores/fetchCache';
import Context from '~/server/stores/context';

import TextButton from '../styled/TextButton';
import Dialog, { DialogClose } from '../styled/Dialog';
import VersionSelect from '../inputs/VersionSelect';
import { Checkbox } from '../form/CheckboxInput';

type Props = {
	onClose: () => void;
};

const DeveloperSettingsDialog = ({ onClose }: Props) => {
	const t = useTranslation();

	const devSecret = Preferences.useWatch('devSecret');
	const [devSecretInput, setDevSecretInput] = useState(devSecret ?? '');

	const [hidden, setHidden] = useState(true);

	const serverUrl = Preferences.useWatch('serverUrl');
	const [serverUrlInput, setServerUrlInput] = useState(
		serverUrl ?? DefaultServerUrl
	);
	const serverUrlError = serverUrlInput !== encodeURI(serverUrlInput);

	const clientVersion = Preferences.useWatch('version');
	const [clientVersionInput, setClientVersionInput] = useState(
		clientVersion ?? ''
	);

	const unpublishedChanges = Preferences.useWatch('unpublishedChanges');
	const [unpublishedChangesInput, setUnpublishedChangesInput] = useState(
		unpublishedChanges ?? false
	);

	const openInCodeButton = Preferences.useWatch('openInCodeButton');
	const [openInCodeButtonInput, setOpenInCodeButtonInput] = useState(
		openInCodeButton ?? false
	);

	return (
		<Dialog
			title="Developer settings"
			trigger={
				<TextButton
					title="Dev mode"
					icon={Turtle}
					onClick={undefined as never}
					className="absolute bottom-1 right-1 cursor-default text-blueGray opacity-10 hocus:text-warmGreen hocus:opacity-50"
				/>
			}
			actions={[
				<DialogClose key="confirm">
					<TextButton
						icon={Check}
						onClick={async () => {
							FetchCache.clear();
							Preferences.update({
								devSecret: devSecretInput || undefined,
								serverUrl: serverUrlInput.replace(/\/$/, '') || undefined,
								version: clientVersionInput || undefined,
								unpublishedChanges: unpublishedChangesInput || undefined,
								openInCodeButton: openInCodeButtonInput || undefined
							});
							Context.softReload();
							onClose();
						}}
						disabled={!!serverUrlError}
						className="self-end text-warmGreen"
					>
						{t({ id: 'general.confirm' })}
					</TextButton>
				</DialogClose>
			]}
			noScroll
			className="flex min-w-[520px] flex-col gap-3"
		>
			<p className="col-span-3 flex items-center gap-2 text-red">
				<TriangleAlert size={28} className="shrink-0" />
				WARNING! Do not change these settings unless you know what you are
				doing! If anything breaks, resetting both inputs to empty will restore
				default values.
			</p>

			<label htmlFor="devMode" className="h4 -mb-2">
				Dev token:
			</label>
			<Input
				id="devMode"
				value={devSecretInput}
				onChange={e => setDevSecretInput(e.currentTarget.value)}
				type={hidden ? 'password' : undefined}
				iconAfter={
					<>
						<TextButton
							onClick={() => setHidden(!hidden)}
							icon={hidden ? EyeOff : Eye}
							title={hidden ? 'Show' : 'Hide'}
							className="pointer-events-auto -m-1"
						/>
						<TextButton
							onClick={() => {
								window.navigator.clipboard.writeText(devSecretInput);
								toast.success(t({ id: 'general.copied_to_clipboard' }));
							}}
							icon={Clipboard}
							title="Copy"
							className="pointer-events-auto -m-1"
						/>
					</>
				}
			/>

			<label htmlFor="serverUrl" className="h4 -mb-2">
				Server url:
			</label>
			<Input
				id="serverUrl"
				value={serverUrlInput}
				onChange={e => setServerUrlInput(e.currentTarget.value)}
				error={serverUrlError}
			/>
			{serverUrlError && (
				<p className="text-red">
					Invalid URL:{' '}
					<span className="font-mono font-bold text-inherit">
						{encodeURI(serverUrlInput)}
					</span>
				</p>
			)}

			<div className="flex items-end gap-2">
				<div className="flex flex-col gap-2">
					<VersionSelect
						value={clientVersionInput}
						onChange={setClientVersionInput}
					/>
				</div>
				<Checkbox
					value={unpublishedChangesInput}
					onChange={setUnpublishedChangesInput}
					label="With unpublished changes"
				/>
			</div>

			<span className="h4 -mb-2">Other options:</span>
			<Checkbox
				value={openInCodeButtonInput}
				onChange={setOpenInCodeButtonInput}
				label={
					<>
						Show{' '}
						<span className="font-bold text-inherit">
							&quot;Open in VS Code&quot;
						</span>{' '}
						button for dev patches
					</>
				}
			/>
		</Dialog>
	);
};

export default DeveloperSettingsDialog;
