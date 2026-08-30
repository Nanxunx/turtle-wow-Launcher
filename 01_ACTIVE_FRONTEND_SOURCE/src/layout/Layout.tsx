import { Toaster } from 'react-hot-toast';
import { type ReactNode } from 'react';

import Preferences from '~/server/stores/preferences';
import Tweaks from '~/server/stores/tweaks';
import FetchCache from '~/server/stores/fetchCache';
import CrashBoundary from '~/components/errors/CrashBoundary';
import PageBackground from '~/components/PageBackground';
import Loading from '~/components/screens/Loading';
import Auth from '~/server/stores/auth';
import { DevMPQs } from '~/server/stores/mods';
import IntlProvider from '~/components/IntlProvider';
import usePreventDefaultEvents from '~/utils/usePreventDefaultEvents';
import Context from '~/server/stores/context';
import Addons from '~/server/modules/addons';
import Updater from '~/server/modules/updater';
import { RadioProvider } from '~/components/radio/Radio';
import { TooltipProvider } from '~/components/styled/Tooltip';

import AppVersion from './AppVersion';
import TopBar from './TopBar';
import ToastAlert from './ToastAlert';

type Props = {
	version: string;
	children: ReactNode;
};

const Layout = ({ version, children }: Props) => {
	usePreventDefaultEvents();

	const storesReady = [
		Addons.useLoaded(),
		Updater.useLoaded(),
		Updater.FileCache.useLoaded(),
		Auth.useLoaded(),
		Context.useLoaded(),
		FetchCache.useLoaded(),
		DevMPQs.useLoaded(),
		Preferences.useLoaded(),
		Tweaks.useLoaded()
	].every(v => v);

	return (
		<TooltipProvider>
			<CrashBoundary>
				<IntlProvider>
					<div className="relative flex grow flex-col gap-3 overflow-hidden border border-blueGray/10 p-[44px]">
						<PageBackground />
						<TopBar />

						{!storesReady ? <Loading /> : children}

						<AppVersion version={version} />
						<RadioProvider />
						<Toaster
							position="top-right"
							containerStyle={{ top: 42 }}
							toastOptions={{ error: { duration: 12000 } }}
							reverseOrder
						>
							{t => <ToastAlert {...t} />}
						</Toaster>
					</div>
				</IntlProvider>
			</CrashBoundary>
		</TooltipProvider>
	);
};

export default Layout;
