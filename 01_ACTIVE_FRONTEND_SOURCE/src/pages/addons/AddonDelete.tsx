import { Trash2 } from 'lucide-react';

import {
	FormattedBeMessage,
	useTranslation,
	Wrappers
} from '~/components/IntlProvider';
import Dialog, { DialogClose } from '~/components/styled/Dialog';
import TextButton from '~/components/styled/TextButton';
import Addons from '~/server/modules/addons';

type Props = {
	name: string;
	isLoading?: boolean;
};

const AddonDelete = ({ name, isLoading }: Props) => {
	const t = useTranslation();
	return (
		<Dialog
			title={t({ id: 'addons.item.delete_confirm' })}
			trigger={
				<TextButton
					icon={Trash2}
					size={18}
					title={t({ id: 'general.delete' })}
					onClick={undefined as never}
					disabled={isLoading}
					className="text-red/50"
				/>
			}
			actions={[
				<DialogClose key="delete">
					<TextButton
						icon={Trash2}
						onClick={() => Addons.remove(name)}
						loading={isLoading}
						className="self-end text-red"
					>
						{t({ id: 'general.delete' })}
					</TextButton>
				</DialogClose>
			]}
		>
			<p className="whitespace-pre-wrap text-blueGray">
				<FormattedBeMessage
					message={{
						id: 'addons.item.delete_text',
						values: { span: Wrappers.span, name }
					}}
				/>
			</p>
		</Dialog>
	);
};

export default AddonDelete;
