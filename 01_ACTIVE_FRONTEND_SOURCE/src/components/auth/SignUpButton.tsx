import { type Control, useWatch } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

import { useTranslation } from '~/components/IntlProvider';
import useQuery from '~/utils/useQuery';
import { fetchRegions } from '~/server/modules/api';
import TextButton from '~/components/styled/TextButton';

type Props = { control: Control<{ region: string }> };

const SignUpButton = ({ control }: Props) => {
	const t = useTranslation();

	const region = useWatch({ name: 'region', control });
	const url = useQuery({
		args: [region],
		query: async region => {
			const r = await fetchRegions();
			if (!r.ok) return undefined;
			const website = r.data.find(s => s.name === region)?.website;
			if (!website) return undefined;
			return `${website}/register`;
		}
	});

	return (
		<TextButton
			icon={UserPlus}
			loading={url.loading}
			disabled={url.data === undefined}
			onClick={() => url.data && open(url.data)}
		>
			{t({ id: 'sign_in.sign_up' })}
		</TextButton>
	);
};

export default SignUpButton;
