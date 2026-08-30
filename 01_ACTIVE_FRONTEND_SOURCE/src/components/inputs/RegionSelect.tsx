import { RotateCcw } from 'lucide-react';
import { type Control, useController } from 'react-hook-form';

import { FormattedBeMessage, useTranslation } from '~/components/IntlProvider';
import useQuery from '~/utils/useQuery';
import { fetchRegions } from '~/server/modules/api';
import Context from '~/server/stores/context';

import TextButton from '../styled/TextButton';
import Select from '../form/Select';

type Props = {
	control: Control<{ region: string }>;
	disabled?: boolean;
};

const RegionSelect = ({ control, disabled }: Props) => {
	const t = useTranslation();

	const offline = Context.useWatch('offline');

	const { field, fieldState } = useController({ name: 'region', control });

	const regions = useQuery({
		args: [offline, undefined as boolean | undefined],
		query: async (offline, revalidate) => {
			if (offline) return [];

			const r = await fetchRegions(revalidate);

			if (!r.ok) {
				control.setError('region', { message: r.error as never });
				return [];
			}

			if (!r.data.find(d => d.name === field.value)) {
				field.onChange(r.data[0].name);
			}

			return r.data.map(s => ({ value: s.name, label: s.name }));
		}
	});

	return (
		<>
			<span>{t({ id: 'general.region' })}</span>
			<div>
				<Select
					value={field.value}
					onChange={field.onChange}
					options={regions.data ?? []}
					disabled={regions.loading || !!disabled || !!offline}
					error={!!fieldState.error}
					className="grow"
					iconAfter={
						<TextButton
							icon={RotateCcw}
							title={t({ id: 'general.reset' })}
							onClick={async () => await regions.refetch([offline, true])}
							loading={regions.loading}
							disabled={offline}
							size={16}
							className="-m-2 -ml-0 text-blueGray"
						/>
					}
				/>
				{fieldState.error && (
					<div className="grow text-red">
						<FormattedBeMessage message={fieldState.error.message} />
					</div>
				)}
			</div>
		</>
	);
};

export default RegionSelect;
