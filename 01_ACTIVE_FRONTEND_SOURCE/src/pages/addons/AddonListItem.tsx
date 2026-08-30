import { CloudDownload, Pencil } from 'lucide-react';
import { useMemo } from 'react';

import {
	FormattedBeMessage,
	useCurrentLocaleShort,
	useTranslation
} from '~/components/IntlProvider';
import { ColoredText } from '~/components/styled/ColoredText';
import IconSpinner from '~/components/styled/IconSpinner';
import TextButton from '~/components/styled/TextButton';
import Addons, {
	localizedTocField,
	type AddonData
} from '~/server/modules/addons';
import Context from '~/server/stores/context';
import Preferences from '~/server/stores/preferences';

import AddonDetail, { type AddonWarning } from './AddonDetail';
import AddonDelete from './AddonDelete';
import AddonRemoteWarning from './AddonRemoteWarning';

const AddonListItem = (addon: AddonData) => {
	const loc = useCurrentLocaleShort();
	const t = useTranslation();

	const warnings = useMemo<AddonWarning[]>(() => {
		const warnings = [];
		if (!addon.toc)
			warnings.push({
				full: t({ id: 'addons.item.no_toc' }),
				short: t({ id: 'addons.item.no_toc_short' })
			});

		if (addon.correctName)
			warnings.push({
				full: (
					<>
						{t(
							{ id: 'addons.item.name_mismatch' },
							{ found: addon.name, expected: addon.correctName }
						)}
						<TextButton
							onClick={() => Addons.fixName(addon)}
							icon={Pencil}
							size={18}
							className="-m-2 ml-auto"
						>
							{t({ id: 'general.rename' })}
						</TextButton>
					</>
				),
				short: t({ id: 'addons.item.name_mismatch_short' })
			});

		const missingDeps = addon.dependencies.filter(
			d => d.status !== 'installed' && !d.optional
		);
		if (missingDeps.length) {
			warnings.push({
				full: t(
					{ id: 'addons.item.missing_dep' },
					{ dependencies: missingDeps.join(', ') }
				),
				short: t({ id: 'addons.item.missing_dep_short' })
			});
		}

		const version = addon.toc?.Interface;
		if (version && version !== '11200')
			warnings.push({
				full: t({ id: 'addons.item.wrong_version' }, { version }),
				short: t({ id: 'addons.item.wrong_version_short' })
			});

		if (addon.gitError) {
			warnings.push({
				full: <AddonRemoteWarning {...addon} />,
				short: t({ id: 'addons.item.repo_warning_short' })
			});
		}

		return warnings;
	}, [addon, t]);

	const isLoading =
		Context.useWatch('addonsState') === 'loading' ||
		addon.status === 'downloading';

	const ignored = Preferences.useWatch('ignoredAddonUpdates').includes(
		addon.name
	);

	return (
		<div className="col-start-1 -col-end-1 -mx-4 grid grid-cols-subgrid items-center px-4 hocus:bg-purple/30">
			<AddonDetail
				addon={addon}
				ignored={ignored}
				installed
				warnings={warnings}
				loading={isLoading}
			/>

			<ColoredText className="line-clamp-1 py-1 text-sm text-blueGray">
				{localizedTocField(addon.toc, 'Notes', loc)}
			</ColoredText>

			<div className="-m-2 flex items-center justify-end gap-2">
				{/* Status */}
				{isLoading ? (
					<>
						<p className="text-sm text-blueGray">{addon.progress}</p>
						<IconSpinner size={18} className="text-blueGray" />
					</>
				) : addon.status === 'invalid' ? (
					<p className="text-sm text-red">
						<FormattedBeMessage message={addon.error} />
					</p>
				) : warnings.length ? (
					<p className="text-sm text-yellow">{warnings[0].short}</p>
				) : !addon.git ? (
					<p
						title={t({ id: 'addons.item.not_versioned' })}
						className="text-sm text-blueGray"
					>
						{addon.toc?.Version}?
					</p>
				) : addon.status === 'upToDate' ? (
					<p className="text-sm text-warmGreen">{addon.toc?.Version}</p>
				) : (
					''
				)}

				{/* Update button */}
				{!ignored && addon.status === 'outOfDate' && (
					<TextButton
						icon={CloudDownload}
						size={18}
						onClick={() => Addons.update(addon.name)}
						className="-mx-2 justify-self-end text-sm"
					>
						{t({ id: 'general.update' })}
					</TextButton>
				)}

				{/* Delete button */}
				<AddonDelete name={addon.name} isLoading={isLoading} />
			</div>
		</div>
	);
};

export default AddonListItem;
