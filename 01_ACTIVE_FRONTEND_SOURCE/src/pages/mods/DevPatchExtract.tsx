import { Channel, invoke } from '@tauri-apps/api/core';
import { open as openFilePicker } from '@tauri-apps/plugin-dialog';
import { PackageOpen } from 'lucide-react';
import { useState } from 'react';
import TextButton from '~/components/styled/TextButton';
import { type ProgressEvent } from '~/server/modules/updater';
import Preferences from '~/server/stores/preferences';
import { formatDuration } from '~/utils';
import useAsyncAction from '~/utils/useAsyncAction';

const DevPatchExtract = () => {
	const a = useAsyncAction();
	const [progress, setProgress] = useState('');
	return (
		<>
			<TextButton
				icon={PackageOpen}
				size={18}
				onClick={a.action(async () => {
					const mpq = await openFilePicker({
						defaultPath: Preferences.pathTo('data'),
						filters: [{ name: 'MPQ', extensions: ['mpq'] }],
						canCreateDirectories: true
					});
					if (!mpq) return;

					const target = await openFilePicker({
						defaultPath: Preferences.pathTo('data'),
						directory: true,
						canCreateDirectories: true
					});
					if (!target) return;

					const extractStart = Date.now();
					await invoke('extract_mpq', {
						path: mpq,
						target,
						channel: new Channel<ProgressEvent>(async e => {
							if (e.event !== 'mpqBuild') return;
							setProgress(`Extracting "${e.data.file}"...`);
						})
					});

					setProgress(
						`Patch extracted to "${target}" in ${formatDuration(
							(Date.now() - extractStart) / 1000
						)}`
					);
					setTimeout(() => setProgress(''), 4000);
				})}
				loading={a.loading}
				className="-my-2"
			>
				Extract MPQ
			</TextButton>

			{progress && (
				<span className="ml-2 overflow-hidden text-ellipsis text-sm text-blueGray">
					{progress}
				</span>
			)}
		</>
	);
};

export default DevPatchExtract;
