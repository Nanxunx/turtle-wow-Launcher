import { Bug } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

import { useTranslation } from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';
import Preferences from '~/server/stores/preferences';

const AppVersion = ({ version }: { version: string }) => {
	const t = useTranslation();

	const region = Preferences.useWatch('account')?.split('@')[1];

	return (
		<div className="absolute bottom-1 right-2 flex items-center opacity-60">
			{region === 'SEA' ? null : (
				<TextButton
					icon={Bug}
					title={t({ id: 'general.bug' })}
					onClick={() =>
						open(
							'https://discord.com/channels/466622455805378571/1309239046026952795'
						)
					}
					size={16}
					className="!p-1 text-blueGray"
				/>
			)}
			<span className="text-sm text-blueGray">v{version}</span>
		</div>
	);
};
export default AppVersion;
