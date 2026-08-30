import {
	CloudDownload,
	FolderOpen,
	GitBranch,
	Package,
	PackageMinus,
	RefreshCcw
} from 'lucide-react';
import { Channel, invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { homeDir } from '@tauri-apps/api/path';

import { type ProgressEvent } from '~/server/modules/updater';
import { Checkbox } from '~/components/form/CheckboxInput';
import Updater from '~/server/modules/updater';
import TextButton from '~/components/styled/TextButton';
import useAsyncAction from '~/utils/useAsyncAction';
import Preferences from '~/server/stores/preferences';
import useQuery from '~/utils/useQuery';
import { type RepositoryInfo } from '~/server/modules/ipc';
import Select from '~/components/form/Select';
import IconSpinner from '~/components/styled/IconSpinner';
import Context from '~/server/stores/context';
import Patcher from '~/server/modules/patcher';
import { path } from '~/server/utils';

import GitPushDialog from './GitPushDialog';
import VSCodeIcon from './VSCodeIcon';
import { DevMPQ, Mods } from '~/server/stores/mods';

type Props = {
	item: DevMPQ;
	refetch: () => Promise<void>;
};

const DevPatchItem = ({ item, refetch }: Props) => {
	const a = useAsyncAction();
	const isUpdating = Updater.useIsUpdating();

	const building = Context.useWatch('buildingPatches');
	const gameRunning = Updater.useWatch('state') === 'gameRunning';
	const openInCodeButton = Preferences.useWatch('openInCodeButton');

	const [progress, setProgress] = useState('');

	const status = useQuery({
		args: [item.folder],
		query: async dir => invoke<RepositoryInfo | null>('git_status', { dir })
	});

	const disabled = a.loading || status.loading || building[item.folder];

	const gitPull = async (branch?: string) => {
		await invoke('git_pull', {
			dir: item.folder,
			branch,
			force: false,
			channel: new Channel<number>(p => {
				if (typeof p !== 'number') return;
				setProgress(`${p.toFixed(0)}%`);
			})
		}).finally(() => setProgress(''));
	};

	const gitPush = async (message: string) => {
		await invoke('git_push', {
			dir: item.folder,
			message,
			channel: new Channel<number>(p => {
				if (typeof p !== 'number') return;
				setProgress(`${p.toFixed(0)}%`);
			})
		}).finally(() => setProgress(''));
	};

	return (
		<div className="col-span-3 flex items-center whitespace-nowrap">
			<p>patch-{item.name}.mpq</p>

			{openInCodeButton && (
				<TextButton
					icon={VSCodeIcon as never}
					size={18}
					title="Open in VSCode"
					onClick={a.action(async () =>
						invoke('run_detached', {
							program: path.join(
								await homeDir(),
								'AppData',
								'Local',
								'Programs',
								'Microsoft VS Code',
								'bin',
								'code.cmd'
							),
							args: [item.folder],
							channel: new Channel<number>()
						})
					)}
					className="text-blueGray"
				/>
			)}

			{progress ? (
				<p className="mx-1 min-w-0 grow overflow-hidden text-ellipsis text-right text-sm text-blueGray">
					{progress}
				</p>
			) : (
				<>
					<TextButton
						icon={FolderOpen}
						size={18}
						onClick={() => openPath(item.folder)}
						disabled={disabled}
						className="mx-2 grow overflow-hidden text-blueGray [&_*]:overflow-hidden [&_*]:text-ellipsis"
					>
						{item.folder}
					</TextButton>

					{status.loading ? (
						<IconSpinner size={18} className="mx-2" />
					) : !status.data ? (
						<p className="mx-1 text-sm text-blueGray/50">Not versioned</p>
					) : (
						<>
							{!status.data.upToDate ? (
								<TextButton
									icon={CloudDownload}
									size={18}
									onClick={a.action(async () => {
										await gitPull();
										status.refetch([item.folder]);
									})}
									disabled={disabled}
									loading={a.loading}
									className="text-sm text-pink"
								>
									Pull
								</TextButton>
							) : Object.keys(status.data.changes).length ? (
								<GitPushDialog
									changes={status.data.changes}
									disabled={disabled}
									onPush={a.action(async message => {
										await gitPull();
										await gitPush(message);
										status.refetch([item.folder]);
									})}
								/>
							) : (
								<p className="mx-1 shrink-0 text-sm text-warmGreen/50">
									Up to date
								</p>
							)}
							{status.data.branches.length > 1 && (
								<Select
									value={status.data.gitRef}
									onChange={a.action(async (branch: string | null) => {
										if (!branch || branch === status.data?.gitRef) return;
										await gitPull(branch);
										status.refetch([item.folder]);
									})}
									options={
										status.data.branches.map(b => ({ value: b, label: b })) ??
										[]
									}
									iconBefore={<GitBranch />}
									disabled={disabled}
									className="ml-2"
								/>
							)}
						</>
					)}

					{!status.loading && (
						<TextButton
							icon={RefreshCcw}
							size={18}
							title="Check for updates"
							onClick={() => status.refetch([item.folder])}
							disabled={disabled}
							className="text-blueGray"
						/>
					)}
				</>
			)}

			<span className="mx-1 text-3xl text-blueGray">|</span>

			<TextButton
				icon={Package}
				size={18}
				onClick={a.action(async e => {
					if (await invoke('is_game_running', { forceClose: true })) {
						toast.error('Game is running and could not be closed');
						return;
					}

					Context.update({
						buildingPatches: { ...building, [item.folder]: true }
					});
					await invoke('build_mpq', {
						path: path.join(
							Preferences.pathTo('data'),
							`patch-${item.name}.mpq`
						),
						source: item.folder,
						channel: new Channel<ProgressEvent>(async e => {
							if (e.event !== 'mpqBuild') return;
							setProgress(`${e.data.file} ${e.data.current}/${e.data.total}`);
						})
					})
						.then(async () => {
							if (gameRunning || e.shiftKey) await Patcher.launchWoW();
						})
						.finally(() => {
							Context.update({
								buildingPatches: { ...building, [item.folder]: false }
							});
							setProgress('');
						});
				})}
				disabled={disabled || isUpdating}
				loading={building[item.folder]}
				className="text-sm text-warmGreen"
			>
				Build
			</TextButton>
			<Checkbox
				label="Override"
				value={item.override}
				onChange={v => {
					Mods.addDevMPQ({ ...item, override: v });
					refetch();
					Updater.verify();
				}}
				disabled={disabled}
			/>
			<TextButton
				icon={PackageMinus}
				size={18}
				title="Untrack this patch"
				onClick={() => {
					Mods.removeDevMPQ(item.folder);
					refetch();
				}}
				disabled={disabled || item.auto}
				className="text-red/50"
			/>
		</div>
	);
};

export default DevPatchItem;
