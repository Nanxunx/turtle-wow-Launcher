import { Settings, StepForward } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import Preferences from '~/server/stores/preferences';
import Dialog from '~/components/styled/Dialog';
import { FormattedBeMessage, useTranslation } from '~/components/IntlProvider';
import TextButton from '~/components/styled/TextButton';
import Context from '~/server/stores/context';

import LaunchArgument from '../settings/LaunchArgument';

const LinuxSetUp = () => {
	const t = useTranslation();

	const [arg, setArg] = useState(Preferences.get().linuxLaunchArgs);

	return (
		<Dialog
			type="nonModal"
			title={t({ id: 'linux_setup.title' })}
			noScroll
			actions={[
				<TextButton
					key="continue"
					icon={StepForward}
					onClick={async () => {
						Preferences.update({ linuxLaunchArgs: arg });
						Context.softReload();
					}}
					disabled={!arg}
					className="text-green"
				>
					{t({ id: 'general.continue' })}
				</TextButton>
			]}
		>
			<p className="pb-2 text-blueGray">
				<FormattedBeMessage
					message={{
						id: 'linux_setup.text',
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

			<LaunchArgument isSetup arg={arg} setArg={setArg} />
		</Dialog>
	);
};

export default LinuxSetUp;
