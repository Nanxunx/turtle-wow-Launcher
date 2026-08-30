import { useMemo } from 'react';
import { CalendarEventSchema } from '~/utils/schemas';

const EventsToday = ({
	events,
	now
}: {
	events?: CalendarEventSchema[];
	now: Date;
}) => {
	const count = useMemo(() => {
		const nowTs = now.getTime();
		const next24h = nowTs + 36 * 60 * 60 * 1000;
		const count = events?.filter(e => {
			const start = new Date(e.start.value).getTime();
			return start >= nowTs && start <= next24h;
		}).length;
		return count;
	}, [events, now]);

	if (!count) return null;

	return (
		<div className="pointer-events-none absolute right-0 top-0 flex aspect-square -translate-y-1/2 translate-x-1/2 items-center rounded-full bg-pink/80 p-[5px] text-xs shadow-[0_0_6px] shadow-pink [line-height:_0]">
			{count > 9 ? '+' : count}
		</div>
	);
};

export default EventsToday;
