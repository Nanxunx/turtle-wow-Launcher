import { type Control, Controller, useForm } from 'react-hook-form';
import { MonitorCog } from 'lucide-react';
import cls from 'classnames';

import { useTranslation } from '~/components/IntlProvider';
import Tweaks, { TweaksSchema } from '~/server/stores/tweaks';
import { Checkbox } from '~/components/form/CheckboxInput';
import Updater from '~/server/modules/updater';
import { Mods } from '~/server/stores/mods';
import Patcher from '~/server/modules/patcher';
import useQuery from '~/utils/useQuery';

import NumberGrabInput from '../components/form/NumberGrabInput';
import {
	ChangeIndicator,
	SaveChangesActions
} from '../components/UnsavedChanges';
import zodResolver from '../utils/zodResolver';
import useScrollHint from '../utils/useScrollHint';

type ItemProps = {
	id: keyof TweaksSchema;
	label: string;
	description: string;
	descriptionClassName?: cls.Value;
	control: Control<TweaksSchema>;
	disabled?: boolean;
} & (
	| {
			type: 'number';
			min?: number;
			max?: number;
			step?: number;
			sensitivity?: number;
	  }
	| { type: 'checkbox' }
);

const Item = ({
	id,
	label,
	description,
	descriptionClassName,
	control,
	...props
}: ItemProps) => (
	<Controller
		name={id}
		control={control}
		render={({ field, fieldState }) => (
			<>
				<p className="relative">
					{label}
					{fieldState.isDirty && <ChangeIndicator />}
				</p>
				{props.type === 'checkbox' ? (
					<Checkbox
						value={!!field.value}
						onChange={field.onChange}
						disabled={props.disabled}
						className="justify-self-center"
					/>
				) : (
					<NumberGrabInput
						value={field.value as number}
						onChange={field.onChange}
						onBlur={field.onBlur}
						{...props}
					/>
				)}
				<p className={cls('text-sm text-blueGray', descriptionClassName)}>
					{description}
				</p>
			</>
		)}
	/>
);

const TweaksTab = () => {
	const t = useTranslation();

	const { handleSubmit, reset, control } = useForm({
		values: Tweaks.get(),
		resolver: zodResolver(TweaksSchema)
	});

	const isUpdating = Updater.useIsUpdating();
	const isRunning = Updater.useWatch('state') === 'gameRunning';
	const disabled = isUpdating || isRunning;

	const superwowEnabled = useQuery({
		args: [],
		query: () =>
			Mods.getCustomDLLs().then(
				r => r.find(m => m.name === 'SuperWoWhook.dll')?.enabled
			)
	});

	const scrollRef = useScrollHint<HTMLDivElement>();

	return (
		<form
			onSubmit={handleSubmit(async config => {
				Tweaks.update(config);
				await Patcher.applyAll();
				reset(config);
			})}
			className="tw-surface flex min-h-0 grow flex-col gap-3"
		>
			<div
				ref={scrollRef}
				className="relative -m-4 -mb-3 grid grow grid-cols-[auto_auto_1fr] content-start items-center gap-x-3 gap-y-1 overflow-y-auto p-4 pb-3"
			>
				<Item
					type="checkbox"
					id="alwaysAutoLoot"
					label={t({ id: 'tweaks.auto_loot' })}
					description={t({
						id: superwowEnabled.data
							? 'tweaks.superwow_handled'
							: 'tweaks.auto_loot_desc'
					})}
					descriptionClassName={
						superwowEnabled.data ? 'text-yellow' : undefined
					}
					disabled={!!superwowEnabled.data}
					control={control}
				/>
				<Item
					type="number"
					id="nameplateRange"
					label={t({ id: 'tweaks.nameplate_range' })}
					description={t({ id: 'tweaks.nameplate_range_desc' })}
					control={control}
					min={0}
					max={41}
				/>

				<h4 className="tw-color col-span-3 mt-3">
					{t({ id: 'tweaks.camera' })}
				</h4>
				<Item
					id="fieldOfView"
					type="number"
					label={t({ id: 'tweaks.fov' })}
					description={t({ id: 'tweaks.fov_desc' })}
					control={control}
					min={90}
					max={180}
					step={5}
				/>
				<Item
					id="farClip"
					type="number"
					label={t({ id: 'tweaks.render_distance' })}
					description={t({ id: 'tweaks.render_distance_desc' })}
					control={control}
					min={100}
					max={1500}
					sensitivity={3}
				/>
				<Item
					id="frillDistance"
					type="number"
					label={t({ id: 'tweaks.clutter_distance' })}
					description={t({ id: 'tweaks.clutter_distance_desc' })}
					control={control}
					min={0}
					max={300}
					sensitivity={0.3}
				/>
				<Item
					id="cameraDistance"
					type="number"
					label={t({ id: 'tweaks.camera_distance' })}
					description={t({ id: 'tweaks.camera_distance_desc' })}
					control={control}
					min={10}
					max={100}
				/>

				<h4 className="tw-color col-span-3 mt-3">
					{t({ id: 'tweaks.sounds' })}
				</h4>
				<Item
					type="checkbox"
					id="soundInBackground"
					label={t({ id: 'tweaks.background_sounds' })}
					description={t({
						id: superwowEnabled.data
							? 'tweaks.superwow_handled'
							: 'tweaks.background_sounds_desc'
					})}
					descriptionClassName={
						superwowEnabled.data ? 'text-yellow' : undefined
					}
					control={control}
					disabled={!!superwowEnabled.data}
				/>
			</div>
			<hr />
			<SaveChangesActions
				confirmIcon={MonitorCog}
				discard={() => reset()}
				reset={() => reset(TweaksSchema.parse({}), { keepDefaultValues: true })}
				disabled={disabled}
				message={
					disabled ? (
						<div className="text-yellow">{t({ id: 'tweaks.cant_apply' })}</div>
					) : undefined
				}
				control={control}
			/>
		</form>
	);
};

export default TweaksTab;
