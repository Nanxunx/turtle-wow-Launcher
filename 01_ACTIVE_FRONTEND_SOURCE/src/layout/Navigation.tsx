import { useTranslation } from '~/components/IntlProvider';
import TurtleLogo from '~/assets/logo.png';
import TextButton from '~/components/styled/TextButton';
import { UnsavedChangesDialog } from '~/components/UnsavedChanges';
import Context, { TabNames } from '~/server/stores/context';
import AccountMenu from '~/components/auth/AccountMenu';
import Addons from '~/server/modules/addons';
import { RadioSmallWidget } from '~/components/radio/Widgets';
import Preferences from '~/server/stores/preferences';

const Navigation = () => {
	const t = useTranslation();

	const activeTab = Context.useWatch('activeTab');
	const ignoredAddonUpdates = Preferences.useWatch('ignoredAddonUpdates');

	const tabNotifications = {
		news: 0,
		tweaks: 0,
		addons: Addons.useSelector(
			s =>
				Object.values(s).filter(
					a =>
						a?.status === 'outOfDate' && !ignoredAddonUpdates.includes(a.name)
				).length
		),
		mods: 0
	};

	return (
		<div className="-mb-3 flex select-none items-center gap-1">
			<div className="pointer-events-none z-10 -my-5 mx-3 w-[180px] shrink-0 pt-1">
				<img src={TurtleLogo} alt="Turtle WoW" />
			</div>
			{TabNames.map(tab => (
				<div key={tab} className="relative">
					<UnsavedChangesDialog
						confirm={() => Context.update({ activeTab: tab })}
					>
						{onClick => (
							<TextButton
								onClick={onClick}
								active={activeTab === tab}
								className="whitespace-nowrap uppercase text-white/90"
							>
								{t({ id: `header.${tab}` })}
							</TextButton>
						)}
					</UnsavedChangesDialog>
					{!!tabNotifications[tab] && (
						<div className="absolute right-1 top-2 flex aspect-square -translate-y-1/2 translate-x-1/2 items-center rounded-full bg-pink/80 p-[5px] text-xs shadow-[0_0_6px] shadow-pink [line-height:_0]">
							{tabNotifications[tab] > 9 ? '+' : tabNotifications[tab]}
						</div>
					)}
				</div>
			))}
			<div className="grow" />
			{activeTab !== 'news' && <RadioSmallWidget />}
			<AccountMenu />
		</div>
	);
};

export default Navigation;
