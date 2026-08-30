import { RotateCcw, ServerOff, TriangleAlert } from 'lucide-react';

import { useTranslation } from '~/components/IntlProvider';
import { Mods } from '~/server/stores/mods';
import Context from '~/server/stores/context';
import useQuery from '~/utils/useQuery';
import IconSpinner from '~/components/styled/IconSpinner';
import TextButton from '~/components/styled/TextButton';

import CustomModItem from './CustomModItem';

const CustomMods = () => {
	const t = useTranslation();
	const dlls = useQuery({ args: [], query: Mods.getCustomDLLs });

	const offline = Context.useWatch('offline');
	return (
		<>
			<div className="col-span-3 flex items-center gap-2">
				<h4 className="tw-color">{t({ id: 'mods.custom_mods' })}</h4>
				{offline && (
					<>
						<ServerOff size={18} className="text-blueGray" />
						<span className="text-blueGray">
							{t({ id: 'general.offline' })}
						</span>
					</>
				)}
				<TextButton
					icon={RotateCcw}
					size={18}
					title={t({ id: 'general.reload' })}
					onClick={() => dlls.refetch()}
					loading={dlls.loading}
					className="-ml-2 text-blueGray"
				/>
			</div>

			<p className="col-span-3 flex items-center gap-2 text-yellow">
				<TriangleAlert size={28} className="shrink-0" />
				{t({ id: 'mods.warning' })}
			</p>

			{!dlls.data ? (
				<div className="col-span-3 py-2">
					<IconSpinner />
				</div>
			) : !dlls.data.length ? (
				<div className="col-span-3 py-2 text-blueGray">
					{t({ id: 'mods.no_custom_mods' })}
				</div>
			) : (
				dlls.data.map(dll => (
					<CustomModItem key={dll.name} item={dll} refetch={dlls.refetch} />
				))
			)}
		</>
	);
};

export default CustomMods;
