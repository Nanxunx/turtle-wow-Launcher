import { DownloadCloud } from 'lucide-react';
import { useEffect } from 'react';

import {
	useCurrentLocaleShort,
	useTranslation
} from '~/components/IntlProvider';
import { ColoredText } from '~/components/styled/ColoredText';
import TextButton from '~/components/styled/TextButton';
import Addons, {
	localizedTocField,
	type AddonData
} from '~/server/modules/addons';
import { type AvailableAddon } from '~/server/modules/api';

import AddonDetail from './AddonDetail';

type Props = {
	addon: AvailableAddon & AddonData;
	loading?: boolean;
};

const AvailableListItem = ({ addon, loading }: Props) => {
	const loc = useCurrentLocaleShort();
	const t = useTranslation();
	const remoteAddon = Addons.remote.useSelector(
		s => s.find(v => v.git === addon.git) ?? addon
	);

	useEffect(() => {
		void Addons.loadRemoteDetails(remoteAddon);
	}, [remoteAddon.git, remoteAddon.gitRef]);

	return (
		<div className="col-start-1 -col-end-1 -mx-4 grid grid-cols-subgrid items-center px-4 hocus:bg-purple/30">
			<AddonDetail addon={remoteAddon} ignored={false} loading={loading} />

			<ColoredText className="line-clamp-1 py-1 text-sm text-blueGray">
				{localizedTocField(remoteAddon.toc, 'Notes', loc)}
			</ColoredText>

			<div className="-m-2 flex items-center justify-end gap-2">
				<TextButton
					onClick={() => Addons.install(remoteAddon)}
					className="text-warmGreen"
					icon={DownloadCloud}
					size={18}
					title={t({ id: 'general.download' })}
					disabled={loading}
				/>
			</div>
		</div>
	);
};

export default AvailableListItem;
