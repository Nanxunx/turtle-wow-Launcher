import { RadioLargeWidget } from '~/components/radio/Widgets';

import ChangelogFeed from './news/ChangelogFeed';
import TwitterFeed from './news/TwitterFeed';

const NewsTab = () => (
	<div className="grid min-h-0 grow grid-cols-2 justify-stretch gap-2 overflow-x-auto">
		<TwitterFeed />
		<div className="flex min-h-0 shrink-0 grow flex-col gap-2">
			<RadioLargeWidget />
			<ChangelogFeed />
		</div>
	</div>
);

export default NewsTab;
