import { RotateCcw } from 'lucide-react';

import useQuery from '~/utils/useQuery';
import { fetchVersions } from '~/server/modules/api';
import Updater from '~/server/modules/updater';
import Context from '~/server/stores/context';
import Toasts from '~/utils/toasts';

import TextButton from '../styled/TextButton';
import Radio from '../form/Radio';

type Props = {
	value: string;
	onChange: (val: string) => void;
	disabled?: boolean;
};

const VersionSelect = ({ value, onChange, disabled }: Props) => {
	const offline = Context.useWatch('offline');
	const versions = useQuery({
		args: [offline, undefined as boolean | undefined],
		query: async (offline, revalidate) => {
			if (offline) return [];

			const r = await fetchVersions(revalidate);

			if (!r.ok) {
				onChange('');
				Toasts.translated(r.error);
				return [];
			}

			return [
				{ key: 'auto', value: '', label: 'Automatic' },
				...r.data.map(value => ({ key: value, value, label: value }))
			];
		}
	});

	const isUpdating = Updater.useIsUpdating();

	if (!versions.data?.length) return null;

	return (
		<>
			<div className="-mb-2 flex gap-2">
				<h4>Client version:</h4>
				<TextButton
					icon={RotateCcw}
					title="Reload"
					onClick={async () => await versions.refetch([offline, true])}
					loading={versions.loading}
					disabled={!!disabled || !!offline}
					size={16}
					className="-m-2 text-blueGray"
				/>
			</div>
			<Radio
				value={value}
				setValue={onChange}
				options={versions.data ?? []}
				disabled={versions.loading || !!disabled || !!offline || isUpdating}
			/>
		</>
	);
};

export default VersionSelect;
