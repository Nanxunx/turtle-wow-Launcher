import {
	Pause,
	Play,
	BoomBox,
	Volume,
	Volume1,
	Volume2,
	VolumeX,
	RotateCcw
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '~/components/IntlProvider';
import Slider from '~/components/form/Slider';
import Preferences from '~/server/stores/preferences';
import Context from '~/server/stores/context';
import useQuery from '~/utils/useQuery';
import { fetchRadioCalendar } from '~/server/modules/api';

import TextButton from '../styled/TextButton';

import { RadioCalendar } from './Calendar';
import { Radio } from './Radio';
import EventsToday from './EventsToday';
import cls from 'classnames';

const Dot = () => (
	<div className="size-2 rounded-full bg-[currentColor] text-inherit" />
);

const LiveDot = () => (
	<div className="size-2 rounded-full bg-red drop-shadow-[0px_0px_50px_white]" />
);

const formatRelativeTime = (ms: number) => {
	const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
	if (totalMinutes < 60) return `${totalMinutes}m`;

	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours < 24) return minutes ? `${hours}h ${minutes}m` : `${hours}h`;

	const days = Math.floor(hours / 24);
	const remainingHours = hours % 24;
	return remainingHours ? `${days}d ${remainingHours}h` : `${days}d`;
};

export const RadioLargeWidget = () => {
	const t = useTranslation();

	const playing = Radio.useWatch('playing');
	const live = Radio.useWatch('live');
	const loading = Radio.useWatch('loading');
	const muted = Radio.useWatch('muted');
	const volume = Preferences.useWatch('radioVolume');

	const controls = Radio.useWatch('controls');

	const offline = Context.useWatch('offline');

	const calendar = useQuery({
		args: [offline, undefined as boolean | undefined],
		query: async (offline, revalidate) => {
			if (offline) return [];

			const r = await fetchRadioCalendar(revalidate);
			if (!r.ok) throw r.error;
			return r.data;
		}
	});

	const [now, setNow] = useState(new Date());
	useEffect(() => {
		const interval = setInterval(() => setNow(new Date()), 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	const nextUp = useMemo(() => {
		const nowTs = now.getTime();
		const event = calendar.data
			?.filter(e => nowTs <= new Date(e.end.value).getTime())
			.sort(
				(a, b) =>
					new Date(a.start.value).getTime() - new Date(b.start.value).getTime()
			)[0];
		if (!event) return null;

		const startTs = new Date(event.start.value).getTime();
		const endTs = new Date(event.end.value).getTime();
		const started = nowTs >= startTs;
		const diffMs = started ? endTs - nowTs : startTs - nowTs;
		const relativeTime = formatRelativeTime(diffMs);
		return {
			started,
			summary: event.summary.replace('Live DJ - ', ''),
			relative: started
				? t({ id: 'radio.ends_in' }, { time: relativeTime })
				: t({ id: 'radio.starts_in' }, { time: relativeTime })
		};
	}, [calendar.data, t, now]);

	return (
		<div className="tw-surface flex min-h-0 shrink-0 flex-col gap-2 p-3">
			<div className="flex items-center gap-2">
				<BoomBox /> <h4 className="tw-color grow">{t({ id: 'news.radio' })}</h4>
				{calendar.error ? (
					<TextButton
						icon={RotateCcw}
						disabled={offline}
						onClick={() => calendar.refetch([offline, true])}
						title={t({ id: 'general.reload' })}
						size={16}
						className="-m-2 -mt-3 text-blueGray"
					/>
				) : (
					<div className="relative">
						<RadioCalendar events={calendar.data} now={now} />
						<EventsToday events={calendar.data} now={now} />
					</div>
				)}
			</div>
			{nextUp && (
				<div
					className={cls(
						'truncate',
						nextUp.started ? 'text-warmGreen' : 'text-blueGray'
					)}
				>
					<span className="uppercase">
						{nextUp.started
							? t({ id: 'radio.live_now' })
							: t({ id: 'radio.next_up' })}
					</span>{' '}
					{nextUp.summary}{' '}
					<span className="text-xs opacity-80">{nextUp.relative}</span>
				</div>
			)}
			<div className="-m-2 mt-0 flex">
				<TextButton
					icon={playing ? Pause : Play}
					loading={loading}
					onClick={controls?.togglePlay as never}
					title={t({ id: playing ? 'radio.pause' : 'radio.play' })}
				/>
				<TextButton
					icon={live ? (LiveDot as never) : (Dot as never)}
					onClick={controls?.goLive as never}
					className="text-blueGray"
					disabled={live}
				>
					{t({ id: 'radio.live' })}
				</TextButton>

				<TextButton
					icon={
						muted
							? VolumeX
							: volume > 0.66
							? Volume2
							: volume > 0.33
							? Volume1
							: Volume
					}
					title={`${Math.round(volume * 100)}%`}
					onClick={controls?.toggleMute as never}
				/>
				<Slider value={volume} onChange={controls?.setVolume as never} />
			</div>
		</div>
	);
};

export const RadioSmallWidget = () => {
	const t = useTranslation();
	const playing = Radio.useWatch('playing');
	const live = Radio.useWatch('live');
	const loading = Radio.useWatch('loading');

	const controls = Radio.useWatch('controls');

	return (
		<div className="tw-surface mb-1 flex items-center gap-2 p-1">
			<TextButton
				size={18}
				icon={playing ? Pause : Play}
				loading={loading}
				onClick={controls?.togglePlay as never}
				title={t({ id: playing ? 'radio.pause' : 'radio.play' })}
				className="-m-2"
			/>
			<TextButton
				icon={live ? (LiveDot as never) : (Dot as never)}
				onClick={controls?.goLive as never}
				className="-m-2 text-blueGray"
				disabled={live}
			>
				{t({ id: 'radio.live' })}
			</TextButton>
		</div>
	);
};
