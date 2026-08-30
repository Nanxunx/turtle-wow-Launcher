import { RotateCcw } from 'lucide-react';
import * as fs from '@tauri-apps/plugin-fs';

import Preferences from '~/server/stores/preferences';
import Context from '~/server/stores/context';
import { useTranslation } from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';

import useScrollHint from '../utils/useScrollHint';

import CustomPatches from './mods/CustomMpqs';
import CustomMods from './mods/CustomMods';
import DevPatches from './mods/DevPatches';

const ModsTab = () => {
	const t = useTranslation();

	const hasDataDir = Context.useWatch('hasDataDir');

	const scrollRef = useScrollHint<HTMLDivElement>();

	const isDev = !!Preferences.useWatch('devSecret');

	if (!hasDataDir) {
		return (
			<div className="tw-surface relative flex min-h-0 grow flex-col items-center justify-center gap-3">
				<h3 className="text-blueGray">{t({ id: 'mods.missing_folder' })}</h3>
				<p className="text-blueGray">{t({ id: 'mods.missing_folder_desc' })}</p>
				<TextButton
					icon={RotateCcw}
					onClick={async () => {
						const dataDir = Preferences.pathTo('data');
						Context.update({ hasDataDir: await fs.exists(dataDir) });
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
		<div className="tw-surface flex min-h-0 grow flex-col gap-3">
			<div
				ref={scrollRef}
				className="relative -m-4 -mb-3 grid grow grid-cols-[auto_auto_1fr] content-start items-center gap-x-3 gap-y-1 overflow-y-auto p-4 pb-3"
			>
				<CustomMods />
				<CustomPatches />
				{isDev && <DevPatches />}
			</div>
		</div>
	);
};

export default ModsTab;
