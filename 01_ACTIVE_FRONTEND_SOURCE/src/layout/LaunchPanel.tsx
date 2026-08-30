import { type ReactElement } from 'react';
import cls from 'classnames';
import { RotateCcw } from 'lucide-react';

import {
	FormattedBeMessage,
	Wrappers,
	useTranslation
} from '~/components/IntlProvider';
import Updater, { type UpdaterStatus } from '~/server/modules/updater';
import Button from '~/components/styled/Button';
import TextButton from '~/components/styled/TextButton';
import UpdateInfoDialog from '~/components/files/UpdateInfoDialog';
import { UnsavedChangesDialog } from '~/components/UnsavedChanges';
import Patcher from '~/server/modules/patcher';
import Context from '~/server/stores/context';
import useAsyncAction from '~/utils/useAsyncAction';
import Preferences from '~/server/stores/preferences';

const LaunchPanel = () => {
	const t = useTranslation();
	const a = useAsyncAction();
	const status = Updater.useSelector(s => s);
	const region = Preferences.useWatch('account')?.split('@')[1];

	const buildVersion = Context.useWatch('buildVersion');
	const launching = Context.useWatch('launching');

	const props: Record<
		UpdaterStatus['state'] | 'gameRunning',
		{ button: ReactElement; helperText?: ReactElement }
	> = {
		verifying: {
			button: (
				<Button disabled className="shrink-0">
					{t({ id: 'launch.verifying' })}
				</Button>
			)
		},
		serverUnreachable: {
			button: buildVersion ? (
				<Button
					onClick={Patcher.launchWoW}
					loading={launching}
					disabled={launching}
					className="shrink-0"
				>
					{t({ id: 'launch.play' })}
				</Button>
			) : (
				<Button onClick={() => Context.softReload()} className="shrink-0">
					{t({ id: 'launch.retry' })}
				</Button>
			),
			helperText: (
				<div className="-mb-2 flex items-center justify-between gap-3">
					<div>
						<FormattedBeMessage
							message={{
								id: 'launch.server_unreachable',
								values: { error: Wrappers.error }
							}}
						/>
						<p className="text-sm text-blueGray">
							{buildVersion ? (
								<FormattedBeMessage
									message={{
										id: 'launch.local',
										values: { version: buildVersion }
									}}
								/>
							) : (
								t({ id: 'launch.try_again' })
							)}
						</p>
					</div>
					<TextButton icon={RotateCcw} onClick={() => Context.softReload()}>
						{t({ id: 'launch.retry' })}
					</TextButton>
				</div>
			)
		},
		launcherOutdated: {
			button: (
				<Button onClick={() => Updater.updateLauncher()} className="shrink-0">
					{t({ id: 'launch.install' })}
				</Button>
			),
			helperText: (
				<div className="-mb-2">
					<p>{t({ id: 'launch.launcher_update_available' })}</p>
					<p className="text-sm text-blueGray">
						{t({ id: 'launch.please_update_launcher' })}
					</p>
				</div>
			)
		},
		updateAvailable: {
			button: <UpdateInfoDialog submit />,
			helperText: (
				<div className="-mb-2 flex items-center justify-between gap-3">
					<div>
						<p>{t({ id: 'launch.update_available' })}</p>
						<p className="text-sm text-blueGray">
							<FormattedBeMessage message={status.message} />
						</p>
					</div>
					<UpdateInfoDialog />
				</div>
			)
		},
		updating: {
			button: <Button disabled>{t({ id: 'launch.updating' })}</Button>,
			helperText: (
				<div className="-mb-2 line-clamp-1 flex shrink grow-0 items-center justify-between gap-3">
					<p className="whitespace-pre text-sm text-blueGray">
						<FormattedBeMessage message={status.message} />
					</p>
					{status.eta && (
						<p className="shrink-0 text-sm text-blueGray">
							{t(
								{ id: 'launch.download_progress' },
								{
									eta: status.eta,
									percent: Math.round(status.progress * 100)
								}
							)}
						</p>
					)}
				</div>
			)
		},
		upToDate: {
			button: (
				<UnsavedChangesDialog confirm={Patcher.launchWoW}>
					{onClick => (
						<Button
							primary
							onClick={onClick}
							loading={launching}
							disabled={launching}
							className="shrink-0"
						>
							{t({ id: 'launch.play' })}
						</Button>
					)}
				</UnsavedChangesDialog>
			),
			helperText: (
				<div className="-mb-2">
					<p>{t({ id: 'launch.up_to_date' })}</p>
					<p className="text-sm text-blueGray">
						<FormattedBeMessage
							message={{
								id: 'launch.version',
								values: { version: buildVersion, region }
							}}
						/>
					</p>
				</div>
			)
		},
		failed: {
			button: (
				<Button onClick={() => Updater.verify()} className="shrink-0">
					{t({ id: 'launch.retry' })}
				</Button>
			),
			helperText: (
				<div className="-mb-2">
					<FormattedBeMessage
						message={{
							id: 'launch.error',
							values: {
								error: Wrappers.error,
								message: <FormattedBeMessage message={status.message} />
							}
						}}
					/>
					<p className="text-sm text-blueGray">
						{t({ id: 'launch.verify_data' })}
					</p>
				</div>
			)
		},
		gameRunning: {
			button: (
				<Button
					onClick={Patcher.launchWoW}
					loading={launching}
					disabled={launching}
					className="shrink-0"
				>
					{t({ id: 'launch.play' })}
				</Button>
			),
			helperText: (
				<div className="-mb-2 flex items-center justify-between gap-3">
					<div>
						<p>{t({ id: 'launch.game_running' })}</p>
						<p className="text-sm text-blueGray">
							{t({ id: 'launch.close_to_update' })}
						</p>
					</div>
					<TextButton
						icon={RotateCcw}
						onClick={a.action(() => Updater.verify())}
						loading={a.loading}
					>
						{t({ id: 'launch.retry' })}
					</TextButton>
				</div>
			)
		}
	};

	const currentState = props[status.state];
	return (
		<div className="flex gap-3">
			<div className="flex min-w-0 grow flex-col justify-end gap-3">
				{currentState.helperText ?? (
					<p className="-mb-2 overflow-hidden overflow-ellipsis whitespace-nowrap text-sm text-blueGray">
						<FormattedBeMessage message={status.message} />
					</p>
				)}
				<div className="tw-loading-wrapper">
					{status.progress !== undefined && (
						<div
							className={cls('tw-loading', {
								'tw-loading-unknown': status.progress === -1
							})}
							style={
								status.progress !== -1
									? {
											clipPath: `inset(0 ${
												100 - Math.ceil(Math.abs(status.progress) * 100)
											}% 0 0)`
									  }
									: undefined
							}
						/>
					)}
				</div>
			</div>
			{currentState.button}
		</div>
	);
};

export default LaunchPanel;
