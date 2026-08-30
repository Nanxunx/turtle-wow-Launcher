import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ExternalLink, NotebookPen, Save, X } from 'lucide-react';
import { useState } from 'react';

import { Checkbox } from '~/components/form/CheckboxInput';
import Input from '~/components/form/Input';
import { useTranslation } from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';
import { ChangeIndicator } from '~/components/UnsavedChanges';
import Updater from '~/server/modules/updater';
import Preferences from '~/server/stores/preferences';
import { path, safeRename, toTocString } from '~/server/utils';
import Toasts from '~/utils/toasts';
import useAsyncAction from '~/utils/useAsyncAction';

type Props = {
	item: {
		key: string;
		enabled: boolean;
		name: string;
		toc?: Record<string, string>;
	};
	refetch: () => Promise<void>;
};

const CustomMpqItem = ({ item, refetch }: Props) => {
	const t = useTranslation();

	const a = useAsyncAction();

	const [isEditing, setIsEditing] = useState(false);
	const [notesInput, setNotesInput] = useState(item.toc?.Notes ?? '');

	const isRunning = Updater.useWatch('state') === 'gameRunning';
	const hasChanges = notesInput !== (item.toc?.Notes ?? '');

	return (
		<>
			<p className="relative">
				{hasChanges && <ChangeIndicator />}
				patch-{item.key}.mpq
			</p>
			<Checkbox
				value={item.enabled}
				onChange={a.action(async v => {
					try {
						const dataDir = Preferences.pathTo('data');
						const oldPath = path.join(dataDir, item.name);
						const newPath = path.join(
							dataDir,
							`${v ? '' : '_'}patch-${item.key}.mpq`
						);
						if (oldPath === newPath) return;
						await safeRename(oldPath, newPath);
						await refetch();
					} catch (e) {
						Toasts.exception(e);
					}
				})}
				disabled={isRunning || a.loading}
			/>
			<div className="flex items-center gap-1">
				{item.toc?.Title && (
					<>
						{item.toc.Title}
						{item.toc?.Version && (
							<span className="text-sm text-warmGreen">
								v{item.toc.Version}
							</span>
						)}
						{item.toc.Website && (
							<TextButton
								icon={ExternalLink}
								size={18}
								title={t({ id: 'addons.detail.open_git' })}
								onClick={() => openUrl(item.toc?.Website ?? '')}
								className="-my-2 -ml-1 text-sm"
							/>
						)}
					</>
				)}
				{isEditing ? (
					<Input
						iconBefore={<NotebookPen size={16} />}
						iconAfter={
							<div className="-m-2 flex">
								{hasChanges && (
									<TextButton
										icon={Save}
										onClick={a.action(async () => {
											const dataDir = Preferences.pathTo('data');
											const mpqPath = path.join(dataDir, item.name);
											await invoke('set_mpq_file', {
												path: mpqPath,
												fileName: 'Patch.toc',
												data: new TextEncoder().encode(
													toTocString({
														...(item.toc ?? {}),
														Notes: notesInput
													})
												)
											});
											await refetch();
											setIsEditing(false);
										})}
										disabled={isRunning}
										loading={a.loading}
										className="text-warmGreen"
									>
										{t({ id: 'general.apply' })}
									</TextButton>
								)}
								<TextButton
									icon={X}
									onClick={() => {
										setNotesInput(item.toc?.Notes ?? '');
										setIsEditing(false);
									}}
									disabled={a.loading}
									className="text-red"
								>
									{t({ id: 'general.discard' })}
								</TextButton>
							</div>
						}
						value={notesInput}
						onChange={v => setNotesInput(v.target.value)}
						disabled={isRunning}
						className="-m-2 border-[transparent] !bg-[transparent] hocus:!bg-darkerGray"
					/>
				) : (
					<TextButton
						icon={NotebookPen}
						size={16}
						onClick={() => setIsEditing(true)}
						disabled={isRunning}
						className="-m-2 text-blueGray"
					>
						{notesInput || t({ id: 'general.no_label' })}
					</TextButton>
				)}
			</div>
		</>
	);
};

export default CustomMpqItem;
