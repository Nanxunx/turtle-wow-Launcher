import { ExternalLink, OctagonX, Sparkles, TriangleAlert } from 'lucide-react';
import { open as openUrl } from '@tauri-apps/plugin-shell';

import { Checkbox } from '~/components/form/CheckboxInput';
import { useTranslation } from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';
import useQuery from '~/utils/useQuery';
import { checkDxvk } from '~/server/modules/api';
import { Mods, type CustomDLL } from '~/server/stores/mods';
import Preferences from '~/server/stores/preferences';
import Updater from '~/server/modules/updater';
import useAsyncAction from '~/utils/useAsyncAction';

type Props = {
	item: CustomDLL;
	refetch: () => Promise<void>;
};

const CustomModItem = ({ item, refetch }: Props) => {
	const t = useTranslation();

	const a = useAsyncAction();

	const isUpdating = Updater.useIsUpdating();
	const ignoredModUpdates = Preferences.useWatch('ignoredModUpdates');

	const isIgnored = ignoredModUpdates.includes(item.name);
	const isDxvk = item.remote?.mod === 'dxvk';

	const dllName =
		item.remote?.files.find(f => f.tags?.includes('loadDll'))?.name ??
		item.name;

	const support = useQuery({
		args: [],
		query: async () => (isDxvk ? checkDxvk() : 'supported')
	});

	return (
		<>
			<p className="relative">
				{support.data === 'unsupported' && (
					<div
						title={t({ id: 'general.unsupported' })}
						className="-mb-1 inline-block pr-1 text-red"
					>
						<OctagonX size={18} />
					</div>
				)}
				{support.data === 'recommended' && (
					<div
						title={t({ id: 'general.recommended' })}
						className="-mb-1 inline-block pr-1 text-green"
					>
						<Sparkles size={18} />
					</div>
				)}
				{isIgnored ? dllName : item.name}
				{!isIgnored && item.remote?.version && (
					<span className="text-sm text-warmGreen"> {item.remote.version}</span>
				)}
			</p>
			<Checkbox
				value={item.enabled}
				onChange={a.action(async v => {
					if (v) await Mods.addCustomDLL(dllName);
					else await Mods.removeCustomDLL(dllName);

					refetch();
					if (!isIgnored && item.remote) Updater.verify();
				})}
				disabled={isUpdating || support.data === 'unsupported' || a.loading}
			/>

			<div className="flex items-center">
				{!isIgnored && item.remote ? (
					<p className="text-sm text-blueGray">
						{t({ id: `mods.${item.remote.mod}_desc` })}
					</p>
				) : (
					<p className="flex items-center gap-1 text-sm text-yellow">
						<TriangleAlert className="inline" size={16} /> Custom mod
					</p>
				)}

				{!isIgnored && item.remote?.url && (
					<TextButton
						icon={ExternalLink}
						size={18}
						title={t({ id: 'addons.detail.open_git' })}
						onClick={() => openUrl(item.remote?.url ?? '')}
						className="-my-2 text-sm"
					/>
				)}

				<div className="grow" />

				{item.remote && (
					<Checkbox
						value={isIgnored}
						label={t({ id: 'general.ignore_updates' })}
						onChange={v => {
							if (v) {
								Preferences.update({
									ignoredModUpdates: [...ignoredModUpdates, item.name]
								});
							} else {
								Preferences.update({
									ignoredModUpdates: ignoredModUpdates.filter(
										a => a !== item.name
									)
								});
							}
							Updater.verify();
						}}
						className="-m-2 shrink-0"
					/>
				)}
			</div>
		</>
	);
};

export default CustomModItem;
