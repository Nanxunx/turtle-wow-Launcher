import { useMemo, useState } from 'react';
import { DownloadCloud, RefreshCw, RotateCcw, Search } from 'lucide-react';
import * as fs from '@tauri-apps/plugin-fs';

import {
	useCurrentLocaleShort,
	useTranslation
} from '~/components/IntlProvider';
import Addons, {
	localizedTocField,
	type AddonToc
} from '~/server/modules/addons';
import Context from '~/server/stores/context';
import Input from '~/components/form/Input';
import Preferences from '~/server/stores/preferences';
import Updater from '~/server/modules/updater';

import IconSpinner from '../components/styled/IconSpinner';
import CollapsibleSection from '../components/CollapsibleSection';
import useScrollHint from '../utils/useScrollHint';
import TextButton from '../components/styled/TextButton';

import CustomAddonDialog from './addons/CustomAddonDialog';
import AddonListItem from './addons/AddonListItem';
import AvailableListItem from './addons/AvailableListItem';

const multiFilter = (filter: string, ...values: (string | undefined)[]) =>
	!filter ||
	values.some(s => s?.toLocaleLowerCase().includes(filter.toLocaleLowerCase()));

type Loc = ReturnType<typeof useCurrentLocaleShort>;
type NamedAddon = { name: string; toc?: AddonToc };

const localeName = (a: NamedAddon, loc: Loc) => {
	const title = localizedTocField(a.toc, 'Title', loc);
	if (!title) return a.name;
	return title.startsWith('|c') ? title.slice(10).trimStart() : title;
};

const localeSort = (loc: Loc) => (lhs: NamedAddon, rhs: NamedAddon) =>
	localeName(lhs, loc).localeCompare(localeName(rhs, loc));

const AddonsTab = () => {
	const loc = useCurrentLocaleShort();
	const t = useTranslation();

	const scrollRef = useScrollHint<HTMLDivElement>();
	const [filter, setFilter] = useState('');

	const addonsState = Context.useWatch('addonsState');

	const addons = Addons.useSelector(s => s);
	const remote = Addons.remote.useSelector(s => s);

	const remoteAddons = useMemo(
		() =>
			remote.filter(
				a =>
					a.status !== 'invalid' &&
					multiFilter(
						filter,
						a.name,
						localizedTocField(a.toc, 'Title', loc),
						a.toc?.Author
					)
			),
		[remote, filter, loc]
	);

	const ignoredAddonUpdates = Preferences.useWatch('ignoredAddonUpdates');

	const [local, toUpdate] = useMemo(() => {
		const local = Object.values(addons)
			.filter(a =>
				multiFilter(
					filter,
					a.name,
					localizedTocField(a.toc, 'Title', loc),
					a.toc?.Author
				)
			)
			.sort(localeSort(loc));

		const outOfDate = local
			.filter(
				a =>
					a.git &&
					a.status === 'outOfDate' &&
					!ignoredAddonUpdates.includes(a.name)
			)
			.map(a => a.name);

		return [local, outOfDate] as const;
	}, [addons, filter, loc, ignoredAddonUpdates]);

	const available = useMemo(
		() =>
			remoteAddons
				?.filter(a => !local.find(l => l.name === a.name || l.git === a.git))
				.sort(localeSort(loc)),
		[local, remoteAddons, loc]
	);

	if (addonsState === 'missing') {
		return (
			<div className="tw-surface relative flex min-h-0 grow flex-col items-center justify-center gap-3">
				<h3 className="text-blueGray">{t({ id: 'addons.missing_folder' })}</h3>
				<p className="text-blueGray">
					{t({ id: 'addons.missing_folder_desc' })}
				</p>
				<TextButton
					icon={RotateCcw}
					onClick={async () => {
						if (Updater.get().state === 'updating')
							await fs.mkdir(Preferences.pathTo('addons'), {
								recursive: true
							});
						await Addons.verify(true);
					}}
					size={32}
					className="text-2xl"
				>
					{t({ id: 'general.reload' })}
				</TextButton>
			</div>
		);
	}

	return (
		<div className="tw-surface relative flex min-h-0 grow flex-col gap-3">
			<div
				ref={scrollRef}
				className="relative -m-4 -mb-3 flex grow flex-col gap-3 overflow-y-auto overflow-x-hidden p-4 pb-3"
			>
				<CollapsibleSection
					title={t({ id: 'addons.installed' })}
					defaultOpen
					isEmpty={!local.length}
					isLoading={addonsState === 'loading'}
					className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1"
				>
					{local.map(addon => (
						<AddonListItem key={addon.git || addon.name} {...addon} />
					))}
				</CollapsibleSection>
				<CollapsibleSection
					title={t({ id: 'addons.available' })}
					defaultOpen
					isEmpty={!available?.length}
					isLoading={addonsState === 'loading'}
					className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1"
				>
					{available.map(addon => (
						<AvailableListItem
							key={addon.git}
							addon={addon}
							loading={addon.status === 'downloading'}
						/>
					))}
				</CollapsibleSection>
			</div>
			<hr />
			<div className="-mb-4 -mt-3 flex items-center gap-2 py-2">
				<TextButton
					onClick={async () => Addons.verify(true)}
					icon={RefreshCw}
					size={18}
					loading={addonsState === 'loading'}
					className="-ml-2 text-blueGray"
				>
					{t({ id: 'addons.check_for_updates' })}
				</TextButton>
				<CustomAddonDialog />
				<div className="grow" />
				{addonsState === 'loading' ? (
					<IconSpinner size={18} />
				) : toUpdate.length > 0 ? (
					<TextButton
						icon={DownloadCloud}
						onClick={() => Addons.update(...toUpdate)}
						className="text-warmGreen"
					>
						{t({ id: 'addons.update_all' })}
					</TextButton>
				) : (
					<p className="text-sm text-blueGray">
						{t({ id: 'addons.up_to_date' })}
					</p>
				)}
			</div>
			<div className="absolute right-3 top-3">
				<Input
					value={filter}
					onChange={e => setFilter(e.target.value)}
					iconAfter={<Search />}
				/>
			</div>
		</div>
	);
};
export default AddonsTab;
