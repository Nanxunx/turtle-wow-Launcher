import { Settings, StepForward } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { app } from '@tauri-apps/api';

import Preferences from '~/server/stores/preferences';
import Dialog from '~/components/styled/Dialog';
import {
	FormattedBeMessage,
	LanguageSelect,
	useTranslation
} from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';
import MirrorSelect from '~/components/inputs/MirrorSelect';
import { fetchMirrors } from '~/server/modules/api';
import Context from '~/server/stores/context';
import { type LocalizedMessage } from '~/utils';

const FirstTimeSetUp = () => {
	const t = useTranslation();

	const [mirror, setMirror] = useState<string>(Preferences.get().mirror ?? '');
	const [error, setError] = useState<LocalizedMessage>();

	return (
		<Dialog
			type="nonModal"
			title={t({ id: 'welcome.title' })}
			actions={[
				<TextButton
					key="continue"
					icon={StepForward}
					onClick={async () => {
						const mirrors = await fetchMirrors();
						if (mirrors.ok && mirrors.data.length > 0 && !mirror) {
							setError(t({ id: 'general.required' }));
							return;
						}

						Preferences.update({
							mirror,
							launcherVersion: await app.getVersion()
						});
						Context.softReload();
					}}
					className="text-green"
				>
					{t({ id: 'general.continue' })}
				</TextButton>
			]}
		>
			<p className="pb-2 text-blueGray">
				<FormattedBeMessage
					message={{
						id: 'welcome.text',
						values: {
							icon: (v: ReactNode) => (
								<span className="text-green">
									<Settings size={18} className="mb-1 mr-1 inline" />
									{v}
								</span>
							)
						}
					}}
				/>
			</p>

			<div className="flex flex-col gap-3">
				<LanguageSelect />
				<MirrorSelect
					value={mirror}
					onChange={e => {
						setMirror(e);
						setError(undefined);
					}}
					error={error}
					setError={setError}
				/>
			</div>
		</Dialog>
	);
};

export default FirstTimeSetUp;
