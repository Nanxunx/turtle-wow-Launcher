import { type ReactNode } from 'react';
import {
	AlertOctagon,
	AlertTriangle,
	HelpCircle,
	GitBranch
} from 'lucide-react';
import cls from 'classnames';

import {
	FormattedBeMessage,
	useCurrentLocaleShort,
	useTranslation
} from '~/components/IntlProvider';
import { ColoredText } from '~/components/styled/ColoredText';
import TextButton from '~/components/styled/TextButton';
import Addons, {
	localizedTocField,
	type AddonData
} from '~/server/modules/addons';
import Dialog from '~/components/styled/Dialog';
import Preferences from '~/server/stores/preferences';
import { Checkbox } from '~/components/form/CheckboxInput';
import Select from '~/components/form/Select';

import AddonDescription from './AddonDescription';
import AddonAside from './AddonAside';
import CustomAddonDialog from './CustomAddonDialog';
import { path } from '~/server/utils';

export type AddonWarning = {
	full: ReactNode;
	short: ReactNode;
};

type Props = {
	addon: AddonData;
	ignored: boolean;
	installed?: boolean;
	warnings?: AddonWarning[];
	loading?: boolean;
};

const AddonDetail = ({
	addon,
	ignored,
	installed,
	warnings,
	loading
}: Props) => {
	const loc = useCurrentLocaleShort();
	const t = useTranslation();

	const name = localizedTocField(addon.toc, 'Title', loc) || addon.name;
	const notes = localizedTocField(addon.toc, 'Notes', loc);

	return (
		<Dialog
			title={<ColoredText className="text-2xl">{name}</ColoredText>}
			actions={[
				<CustomAddonDialog key="changeUrl" name={addon.name} />,
				addon.gitRef && (addon.branches?.length ?? 0) > 1 ? (
					<Select
						key="branch"
						value={addon.gitRef}
						onChange={v => {
							if (!v || v === addon.gitRef) return;
							Addons.changeBranch(addon.name, v);
							Addons.update(addon.name);
						}}
						options={addon.branches?.map(b => ({ value: b, label: b })) ?? []}
						iconBefore={<GitBranch />}
					/>
				) : null,
				addon.git ? (
					<Checkbox
						key="ignore"
						label={t({ id: 'general.ignore_updates' })}
						value={ignored}
						onChange={v => {
							const ignoredAddons = Preferences.get().ignoredAddonUpdates;
							if (v) {
								Preferences.update({
									ignoredAddonUpdates: [...ignoredAddons, addon.name]
								});
							} else {
								Preferences.update({
									ignoredAddonUpdates: ignoredAddons.filter(
										a => a !== addon.name
									)
								});
							}
						}}
						className="-mr-2"
					/>
				) : null
			]}
			trigger={
				<TextButton
					icon={
						addon.status === 'invalid'
							? AlertOctagon
							: warnings?.length
							? AlertTriangle
							: HelpCircle
					}
					onClick={undefined as never}
					size={18}
					loading={loading}
					className={cls(
						'-mx-2',
						addon.status === 'invalid'
							? 'text-red'
							: warnings?.length
							? 'text-yellow'
							: 'text-blueGray'
					)}
				>
					<ColoredText
						inheritColor={loading}
						className="cursor-[inherit] whitespace-nowrap"
					>
						{name}
					</ColoredText>
				</TextButton>
			}
			className="w-full"
			actionsClassName="gap-2"
		>
			{addon.error && (
				<div className="mb-2 w-full whitespace-pre-wrap border border-red/60 bg-red/5 p-2 text-sm text-red">
					<AlertOctagon
						size={18}
						className="-my-1 inline pb-[2px] text-inherit"
					/>{' '}
					<FormattedBeMessage message={addon.error} />
				</div>
			)}
			{warnings?.map((w, i) => (
				<div
					key={i}
					className="mb-2 whitespace-pre-wrap border border-yellow/60 bg-yellow/5 p-2 text-sm text-yellow"
				>
					<AlertTriangle
						size={18}
						className="-my-1 inline pb-[2px] text-inherit"
					/>{' '}
					{w.full}
				</div>
			))}

			<AddonAside
				folder={
					installed
						? path.join(Preferences.pathTo('addons'), addon.name)
						: undefined
				}
				git={addon.git}
				toc={addon.toc}
				dependencies={addon.dependencies}
			/>

			<AddonDescription
				addon={addon}
				fallback={<ColoredText className="mb-3">{notes}</ColoredText>}
			/>
		</Dialog>
	);
};
export default AddonDetail;
