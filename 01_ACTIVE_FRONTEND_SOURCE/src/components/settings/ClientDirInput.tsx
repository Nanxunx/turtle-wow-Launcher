import { open as openFilePicker } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import {
	CircleCheckBig,
	FolderOpen,
	FolderSearch,
	OctagonAlert,
	Pencil,
	Save,
	X
} from 'lucide-react';
import * as fs from '@tauri-apps/plugin-fs';
import { useState } from 'react';

import { FormattedBeMessage, useTranslation } from '~/components/IntlProvider';
import Input from '~/components/form/Input';
import TextButton from '~/components/styled/TextButton';
import Preferences from '~/server/stores/preferences';
import { type LocalizedMessage } from '~/utils';
import Context from '~/server/stores/context';

type Props = {
	onClose: () => void;
	disabled?: boolean;
};

const ClientDirInput = ({ onClose, disabled }: Props) => {
	const t = useTranslation();

	const [clientDirInput, setClientDirInput] = useState<string>();
	const [error, setError] = useState<LocalizedMessage>();

	const isEditing = clientDirInput !== undefined;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<h4 className={isEditing ? 'grow' : undefined}>
					{t({ id: 'preferences.install_location' })}
				</h4>
				{isEditing ? (
					<>
						<TextButton
							icon={X}
							onClick={() => {
								setError(undefined);
								setClientDirInput(undefined);
							}}
							className="-mx-1 -my-2 text-red"
						>
							{t({ id: 'general.discard' })}
						</TextButton>
						<TextButton
							icon={Save}
							onClick={async () => {
								if (clientDirInput === Preferences.clientDir()) {
									setError(undefined);
									setClientDirInput(undefined);
									return;
								}

								if (
									!clientDirInput ||
									clientDirInput === Context.get().fallbackDir
								) {
									onClose();
									Preferences.update({ clientDir: undefined });
									Context.softReload();
									return;
								}

								if (
									clientDirInput.includes('Program Files') ||
									clientDirInput.endsWith('Windows')
								) {
									setError({ id: 'preferences.install_location_invalid' });
									return;
								}

								if (
									!(await fs.exists(clientDirInput)) ||
									!(await fs.stat(clientDirInput)).isDirectory
								) {
									setError({ id: 'preferences.install_location_missing' });
									return;
								}

								const files = await fs.readDir(clientDirInput);
								if (
									files.length > 0 &&
									!files.some(
										f => f.name === 'WoW.exe' || f.name === 'turtle-wow.exe'
									)
								) {
									setError({ id: 'preferences.install_location_not_empty' });
									return;
								}

								onClose();
								Preferences.update({ clientDir: clientDirInput });
								Context.softReload();
							}}
							disabled={disabled}
							className="-mx-1 -my-2 text-warmGreen"
						>
							{t({ id: 'general.apply' })}
						</TextButton>
					</>
				) : (
					<TextButton
						icon={FolderOpen}
						onClick={() => openPath(Preferences.clientDir())}
						className="pointer-events-auto -mx-1 -my-2 text-blueGray"
					>
						{t({ id: 'general.open_folder' })}
					</TextButton>
				)}
			</div>
			<Input
				value={clientDirInput ?? Preferences.clientDir()}
				onChange={e => {
					setError(undefined);
					setClientDirInput(e.currentTarget.value);
				}}
				disabled={!isEditing}
				iconBefore={
					!isEditing ? undefined : error ? (
						<OctagonAlert className="text-red" />
					) : (
						<CircleCheckBig className="text-green" />
					)
				}
				iconAfter={
					isEditing ? (
						<TextButton
							icon={FolderSearch}
							onClick={async () => {
								const file = await openFilePicker({
									directory: true,
									canCreateDirectories: true
								});
								if (!file) return;
								setError(undefined);
								setClientDirInput(file);
							}}
							className="-mx-1 -my-2"
						>
							{t({ id: 'preferences.install_location_select' })}
						</TextButton>
					) : (
						<TextButton
							icon={Pencil}
							size={16}
							onClick={() => setClientDirInput(Preferences.clientDir())}
							disabled={disabled}
							className="-mx-1 -my-2"
						>
							{t({ id: 'general.change' })}
						</TextButton>
					)
				}
				error={!!error}
				className="grow"
			/>

			{error ? (
				<div className="grow text-red">
					<FormattedBeMessage message={error} />
				</div>
			) : isEditing ? (
				<p className="text-sm text-blueGray">
					{t({ id: 'preferences.install_location_text' })}
				</p>
			) : null}
		</div>
	);
};

export default ClientDirInput;
