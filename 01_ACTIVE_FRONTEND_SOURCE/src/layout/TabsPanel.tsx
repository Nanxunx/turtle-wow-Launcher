import { type JSX } from 'react';

import Context, { type ContextSchema } from '~/server/stores/context';
import AddonsTab from '~/pages/AddonsTab';
import ModsTab from '~/pages/ModsTab';
import NewsTab from '~/pages/NewsTab';
import TweaksTab from '~/pages/TweaksTab';

const Tabs = {
	news: <NewsTab />,
	tweaks: <TweaksTab />,
	addons: <AddonsTab />,
	mods: <ModsTab />
	// profiles: <ProfilesTab />
} satisfies Record<ContextSchema['activeTab'], JSX.Element | null>;

const TabsPanel = () => {
	const activeTab = Context.useWatch('activeTab');
	return Tabs[activeTab];
};

export default TabsPanel;
