import { ChevronRight, Pencil, Save, TerminalSquare, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';

import Input from '~/components/form/Input';
import {
	FormattedBeMessage,
	useTranslation,
	Wrappers
} from '~/components/IntlProvider';
import { type LocalizedMessage } from '~/utils';
import Preferences from '~/server/stores/preferences';
import Context from '~/server/stores/context';

import TextButton from '../styled/TextButton';

const options = {
	Wine: 'wine $WoW.exe$',
	Port_Proton: 'flatpak run ru.linux_gaming.PortProton $WoW.exe$',
	Steam: 'steam steam://rungameid/<YOUR_ID_HERE>',
	Lutris: 'lutris lutris:rungameid/<YOUR_ID_HERE>',
	Lutris_Flatpak:
		'flatpak run net.lutris.Lutris lutris:rungameid/<YOUR_ID_HERE>'
} as const;

type Props =
	| {
			isSetup: true;
			arg?: string;
			setArg: (arg?: string) => void;
	  }
	| {
			isSetup?: false;
			onClose: () => void;
	  };

const LaunchArgument = (props: Props) => {
	const t = useTranslation();

	const [launchArgsInput, setLaunchArgsInput] = useState<string>();
	const [error, setError] = useState<LocalizedMessage>();
	const isEditing = !props.isSetup && launchArgsInput !== undefined;

	const currentValue = Preferences.useWatch('linuxLaunchArgs') ?? '';

	const currentInput = props.isSetup ? props.arg : launchArgsInput;
	const setCurrentInput = props.isSetup ? props.setArg : setLaunchArgsInput;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<h4 className="grow">{t({ id: 'linux_setup.launch_args' })}</h4>
				{isEditing && (
					<>
						<TextButton
							icon={X}
							onClick={() => setCurrentInput(undefined)}
							className="-mx-1 -my-2 text-red"
						>
							{t({ id: 'general.discard' })}
						</TextButton>
						<TextButton
							icon={Save}
							onClick={async () => {
								if (launchArgsInput === currentValue) {
									setError(undefined);
									setCurrentInput(undefined);
									return;
								}

								!props.isSetup && props.onClose?.();
								Preferences.update({ linuxLaunchArgs: launchArgsInput });
								Context.softReload();
							}}
							disabled={!launchArgsInput}
							className="-mx-1 -my-2 text-warmGreen"
						>
							{t({ id: 'general.apply' })}
						</TextButton>
					</>
				)}
			</div>
			<Input
				value={currentInput ?? currentValue}
				onChange={e => setCurrentInput(e.target.value)}
				iconBefore={
					<TerminalSquare className={error ? 'text-red' : 'text-warmGreen'} />
				}
				error={!!error}
				disabled={!props.isSetup && launchArgsInput === undefined}
				iconAfter={
					!props.isSetup && launchArgsInput === undefined ? (
						<TextButton
							icon={Pencil}
							size={16}
							onClick={() => setCurrentInput(currentValue)}
							className="-mx-1 -my-2"
						>
							{t({ id: 'general.change' })}
						</TextButton>
					) : undefined
				}
				className="grow"
			/>

			{error ? (
				<div className="grow text-red">
					<FormattedBeMessage message={error} />
				</div>
			) : (
				<p className="text-sm text-blueGray">
					<FormattedBeMessage
						message={{
							id: 'linux_setup.launch_args_desc',
							values: {
								code: Wrappers.code,
								link: (v: ReactNode) => (
									<TextButton
										onClick={() =>
											open('https://forum.turtlecraft.gg/viewtopic.php?t=23795')
										}
										className="-m-2 inline-flex text-sm"
									>
										{v}
									</TextButton>
								)
							}
						}}
					/>
				</p>
			)}

			{(props.isSetup || isEditing) && (
				<div className="-my-2 flex items-center gap-2">
					<p className="flex items-center gap-1 text-blueGray">
						<ChevronRight size={18} />
						{t({ id: 'linux_setup.presets' })}
					</p>
					{(Object.keys(options) as (keyof typeof options)[]).map(key => (
						<TextButton
							key={key}
							onClick={() => setCurrentInput(options[key])}
							active={options[key] === currentInput}
							className="text-sm"
						>
							{key.replace('_', ' ')}
						</TextButton>
					))}
				</div>
			)}
		</div>
	);
};

export default LaunchArgument;
