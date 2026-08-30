import { CalendarDays } from 'lucide-react';
import cls from 'classnames';
import { useMemo } from 'react';

import { type CalendarEventSchema } from '~/utils/schemas';

import { useCurrentLocale, useTranslation } from '../IntlProvider';
import Dialog from '../styled/Dialog';
import TextButton from '../styled/TextButton';
import Tooltip from '../styled/Tooltip';

const lastMondayOfPreviousMonth = (now: Date) => {
	const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
	const day = prevMonthEnd.getDay();
	const diff = day === 1 ? 0 : (day + 6) % 7;
	return new Date(
		prevMonthEnd.getFullYear(),
		prevMonthEnd.getMonth(),
		prevMonthEnd.getDate() - diff
	);
};

const secondSundayOfNextMonth = (now: Date) => {
	const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	const day = nextMonthStart.getDay();
	const firstSunday =
		day === 0
			? nextMonthStart
			: new Date(
					nextMonthStart.getFullYear(),
					nextMonthStart.getMonth(),
					1 + (7 - day)
			  );
	return new Date(
		firstSunday.getFullYear(),
		firstSunday.getMonth(),
		firstSunday.getDate() + 7
	);
};

const getTimeString = (
	formatter: Intl.DateTimeFormat,
	time: CalendarEventSchema['start']
) => {
	if (time.type === 'date') return undefined;
	const date = new Date(time.value);
	return formatter.format(date);
};

const toDayKey = (date: Date) =>
	`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export const RadioCalendar = ({
	events,
	now
}: {
	events?: CalendarEventSchema[];
	now: Date;
}) => {
	const t = useTranslation();

	const nowTs = now.getTime();
	const nowDayKey = useMemo(() => toDayKey(now), [now]);
	const days = useMemo(() => {
		const start = lastMondayOfPreviousMonth(now);
		const end = secondSundayOfNextMonth(now);

		const builtDays: Date[] = [];
		const cursor = new Date(start);
		while (cursor <= end) {
			builtDays.push(new Date(cursor));
			cursor.setDate(cursor.getDate() + 1);
		}

		return builtDays;
	}, [now]);

	const eventsByDay = useMemo(() => {
		const grouped = new Map<string, CalendarEventSchema[]>();

		for (const event of events ?? []) {
			const key = toDayKey(new Date(event.start.value));
			const list = grouped.get(key);
			if (list) {
				list.push(event);
			} else {
				grouped.set(key, [event]);
			}
		}

		for (const list of grouped.values()) {
			list.sort((a, b) => a.start.type.localeCompare(b.start.type));
		}

		return grouped;
	}, [events]);

	const loc = useCurrentLocale();

	const timeFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat(loc, {
				hour: '2-digit',
				minute: '2-digit'
			}),
		[loc]
	);

	const weekdayNames = useMemo(() => {
		const f = new Intl.DateTimeFormat(loc, { weekday: 'long' });
		return Array.from(
			{ length: 7 },
			(_, i) => f.format(new Date(1970, 0, 5 + i)) // Monday start
		);
	}, [loc]);

	return (
		<Dialog
			title={t({ id: 'radio.upcoming_events' })}
			trigger={
				<TextButton
					icon={CalendarDays}
					title={t({ id: 'radio.upcoming_events' })}
					loading={!events}
					disabled={!events?.length}
					className="-m-2 -mt-2"
					onClick={undefined as never}
				/>
			}
			className="!max-h-[98vh] !w-[98vw] !max-w-screen-lg bg-darkGray/90"
		>
			<div className="-m-3 grid grid-cols-7">
				{weekdayNames.map((name, i) => (
					<div key={i} className="py-2 text-center text-sm">
						{name}
					</div>
				))}

				{days.map((day, i) => {
					const dayKey = toDayKey(day);
					const currMonth = day.getMonth() === now.getMonth();
					const currDay = currMonth && dayKey === nowDayKey;
					return (
						<div
							key={i}
							className={cls(
								'tw-surface aspect-square overflow-auto p-0',
								currMonth && 'bg-blueGray/10',
								currDay && 'border-warmGreen !bg-warmGreen/10'
							)}
						>
							<div
								className={cls(
									'pl-1',
									currDay && 'text-warmGreen',
									!currMonth && 'text-blueGray'
								)}
							>
								{day.getDate()}
							</div>

							{eventsByDay.get(dayKey)?.map(ev => {
								const startString = getTimeString(timeFormatter, ev.start);
								const endString = getTimeString(timeFormatter, ev.end);
								const startTs = new Date(ev.start.value).getTime();
								const endTs = new Date(ev.end.value).getTime();
								const runningNow =
									currDay && startTs <= nowTs && nowTs <= endTs;
								const past = endTs < nowTs;
								return (
									<Tooltip
										key={ev.id}
										trigger={
											<div
												className={cls(
													'tw-hocus cursor-help overflow-hidden px-1',
													past && 'opacity-25'
												)}
											>
												<div className="line-clamp-2 cursor-[inherit] text-sm text-inherit">
													<span
														className={cls(
															'cursor-[inherit] pr-1 text-xs',
															runningNow
																? 'uppercase text-warmGreen'
																: 'text-blueGray'
														)}
													>
														{runningNow ? t({ id: 'radio.live' }) : startString}
													</span>
													{ev.title}
												</div>
											</div>
										}
										className="-m-3 flex flex-col gap-2"
									>
										{startString && (
											<div className="text-blueGray">
												{startString} - {endString}
											</div>
										)}
										<h3 className="tw-color">{ev.summary}</h3>
										{ev.description && (
											<div
												dangerouslySetInnerHTML={{
													__html: ev.description.replace(/^(\<br\/?\>)+/, '')
												}}
											/>
										)}
									</Tooltip>
								);
							})}
						</div>
					);
				})}
			</div>
		</Dialog>
	);
};
