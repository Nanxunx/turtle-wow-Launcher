import { useMemo } from 'react';
import Markdown from 'react-markdown';
import { ArrowRight } from 'lucide-react';
import { app } from '@tauri-apps/api';

import Preferences from '~/server/stores/preferences';
import Dialog from '~/components/styled/Dialog';
import { useTranslation } from '~/components/IntlProvider';
import changelog from '~/assets/changelog.md?raw';
import Updater from '~/server/modules/updater';
import Context from '~/server/stores/context';
import FetchCache from '~/server/stores/fetchCache';

import { isVersionHigher } from '../../utils';
import TextButton from '../styled/TextButton';

type Props = { oldVersion?: string };

const WhatsNew = ({ oldVersion }: Props) => {
	const t = useTranslation();

	const parsed = useMemo(() => {
		if (!oldVersion) return changelog;
		return changelog
			.split('\n')
			.map(l => {
				if (!l.startsWith('### ')) return l;
				const version = l.slice(4);
				if (isVersionHigher(version, oldVersion)) return l.slice(1);
				return l;
			})
			.join('\n');
	}, [oldVersion]);

	return (
		<Dialog
			type="nonModal"
			title={t({ id: 'general.whats_new' })}
			onSubmit={async e => {
				e.preventDefault();

				// Clear cache on new launcher version
				Preferences.update({ launcherVersion: await app.getVersion() });
				Updater.FileCache.set({});
				FetchCache.clear();
				Context.softReload();
			}}
			actions={[
				<TextButton key="continue" type="submit" icon={ArrowRight}>
					{t({ id: 'general.continue' })}
				</TextButton>
			]}
			className="max-h-[60vh]"
		>
			<Markdown className="changelog">{parsed}</Markdown>
		</Dialog>
	);
};

export default WhatsNew;
