import { HelpCircle, RotateCcw } from 'lucide-react';

import DevPatchItem from './DevPatchItem';
import DevPatchDialog from './DevPatchDialog';
import useQuery from '~/utils/useQuery';
import { Mods } from '~/server/stores/mods';
import DevPatchExtract from './DevPatchExtract';
import TextButton from '~/components/styled/TextButton';
import { useTranslation } from '~/components/IntlProvider';
import IconSpinner from '~/components/styled/IconSpinner';

const DevPatches = () => {
	const t = useTranslation();
	const mpqs = useQuery({ args: [], query: Mods.getDevMPQs });
	return (
		<>
			<div className="col-span-3 mt-3 flex items-center whitespace-nowrap">
				<h4 className="tw-color mr-2">Dev patches</h4>
				<TextButton
					icon={RotateCcw}
					size={18}
					title={t({ id: 'general.reload' })}
					onClick={() => mpqs.refetch()}
					loading={mpqs.loading}
					className="-ml-2 text-blueGray"
				/>
				<DevPatchDialog refetch={mpqs.refetch} />
				<DevPatchExtract />
			</div>

			<div className="col-span-3 flex items-center gap-2 text-blueGray">
				<HelpCircle size={28} className="shrink-0" />
				<p className="text-inherit">
					To ignore local changes in launcher-tracked patches, use the{' '}
					<span className="font-bold text-inherit">Override</span> checkbox.{' '}
					Selecting <span className="font-bold text-inherit">Build</span> while
					the client is running will close it and{' '}
					<span className="font-bold text-inherit">Shift + Click</span> will
					start the client as soon as the build is finished. Folders that follow{' '}
					<span className="font-bold text-inherit">/Data/patch-*</span> naming
					will be automatically tracked.
				</p>
			</div>

			{!mpqs.data ? (
				<div className="col-span-3 py-2">
					<IconSpinner />
				</div>
			) : !mpqs.data.length ? (
				<div className="col-span-3 py-2 text-blueGray">
					No development patches tracked. Add a new one by clicking on &quot;Add
					patch&quot; and selecting a directory.
				</div>
			) : (
				mpqs.data.map(mpq => (
					<DevPatchItem key={mpq.folder} item={mpq} refetch={mpqs.refetch} />
				))
			)}
		</>
	);
};

export default DevPatches;
