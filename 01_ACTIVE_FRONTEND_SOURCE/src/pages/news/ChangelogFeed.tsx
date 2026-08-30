import {
	CircleHelp,
	OctagonX,
	RotateCcw,
	Scroll,
	ServerOff
} from 'lucide-react';

import { useTranslation } from '~/components/IntlProvider';
import useQuery from '~/utils/useQuery';
import { fetchChangelogs } from '~/server/modules/api';
import TextButton from '~/components/styled/TextButton';
import Context from '~/server/stores/context';
import Preferences from '~/server/stores/preferences';

import useScrollHint from '../../utils/useScrollHint';
import IconSpinner from '../../components/styled/IconSpinner';

import ChangelogItem from './ChangelogItem';

const ChangelogFeed = () => {
	const t = useTranslation();

	const scrollRef = useScrollHint<HTMLDivElement>();

	const region = Preferences.useWatch('account')?.split('@')[1];
	const offline = Context.useWatch('offline');

	const posts = useQuery({
		args: [
			region,
			undefined as boolean | undefined,
			undefined as boolean | undefined
		],
		query: async (region, offline, revalidate) => {
			if (offline) return [];

			const r = await fetchChangelogs(region, revalidate);
			if (!r.ok) throw r.error;
			return r.data;
		}
	});

	return (
		<div className="tw-surface flex min-h-0 grow flex-col p-0">
			<div className="flex items-center justify-between p-3 pb-2">
				<h4 className="tw-color flex items-center gap-2 self-start">
					<Scroll /> {t({ id: 'news.changelog' })}
				</h4>
				<TextButton
					icon={RotateCcw}
					disabled={offline}
					onClick={() => posts.refetch([region, offline, true])}
					title={t({ id: 'general.reload' })}
					size={16}
					className="-m-2 -mt-3 text-blueGray"
				/>
			</div>

			<div ref={scrollRef} className="grow overflow-y-auto overflow-x-hidden">
				{offline ? (
					<div className="flex h-full flex-col items-center justify-center gap-2">
						<ServerOff size={48} className="text-blueGray" />
						<p className="italic text-blueGray">{t({ id: 'news.offline' })}</p>
					</div>
				) : posts.loading ? (
					<div className="flex h-full flex-col items-center justify-center gap-2">
						<IconSpinner size={48} className="text-blueGray" />
						<p className="italic text-blueGray">{t({ id: 'news.loading' })}</p>
					</div>
				) : posts.error ? (
					<div className="flex h-full flex-col items-center justify-center gap-2">
						<OctagonX size={48} className="text-red" />
						<p className="italic text-blueGray">{t({ id: 'news.error' })}</p>
						<TextButton
							icon={RotateCcw}
							disabled={offline}
							onClick={() => posts.refetch([region, offline, true])}
						>
							{t({ id: 'general.reload' })}
						</TextButton>
					</div>
				) : !posts.data?.length ? (
					<div className="flex h-full flex-col items-center justify-center gap-2">
						<CircleHelp size={48} className="text-blueGray" />
						<p className="italic text-blueGray">{t({ id: 'news.empty' })}</p>
						<TextButton
							icon={RotateCcw}
							disabled={offline}
							onClick={() => posts.refetch([region, offline, true])}
						>
							{t({ id: 'general.reload' })}
						</TextButton>
					</div>
				) : (
					<div className="flex flex-col">
						{posts.data?.map(c => (
							<ChangelogItem key={c.id} {...c} />
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default ChangelogFeed;
