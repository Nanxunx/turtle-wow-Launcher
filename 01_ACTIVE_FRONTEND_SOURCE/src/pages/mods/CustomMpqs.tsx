import { RotateCcw } from 'lucide-react';

import { useTranslation } from '~/components/IntlProvider';
import useQuery from '~/utils/useQuery';
import { Mods } from '~/server/stores/mods';
import IconSpinner from '~/components/styled/IconSpinner';
import TextButton from '~/components/styled/TextButton';
import Updater from '~/server/modules/updater';

import CustomMpqItem from './CustomMpqItem';

const CustomMpqs = () => {
	const t = useTranslation();
	const mpqs = useQuery({ args: [], query: Mods.getCustomMPQs });
	const isRunning = Updater.useWatch('state') === 'gameRunning';
	return (
		<>
			<div className="col-span-3 mt-3 flex items-center gap-2">
				<h4 className="tw-color">{t({ id: 'mods.custom_mpqs' })}</h4>
				<TextButton
					icon={RotateCcw}
					size={18}
					title={t({ id: 'general.reload' })}
					onClick={() => mpqs.refetch()}
					disabled={isRunning}
					loading={mpqs.loading}
					className="-ml-2 text-blueGray"
				/>
			</div>

			{!mpqs.data ? (
				<div className="col-span-3 py-2">
					<IconSpinner />
				</div>
			) : !mpqs.data.length ? (
				<div className="col-span-3 py-2 text-blueGray">
					{t({ id: 'mods.no_custom_mpqs' })}
				</div>
			) : (
				mpqs.data.map(mpq => (
					<CustomMpqItem key={mpq.key} item={mpq} refetch={mpqs.refetch} />
				))
			)}
		</>
	);
};

export default CustomMpqs;
