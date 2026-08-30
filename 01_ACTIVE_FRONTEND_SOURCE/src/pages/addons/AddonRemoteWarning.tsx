import { ClipboardCopy, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

import {
	FormattedBeMessage,
	useTranslation,
	Wrappers
} from '~/components/IntlProvider';
import Dialog, { DialogClose } from '~/components/styled/Dialog';
import TextButton from '~/components/styled/TextButton';
import Addons, { type AddonData } from '~/server/modules/addons';

import CustomAddonDialog from './CustomAddonDialog';

type Props = Pick<AddonData, 'name' | 'gitError'>;

const AddonRemoteWarning = ({ name, gitError }: Props) => {
	const t = useTranslation();
	return (
		<>
			{t({ id: 'addons.item.repo_warning' })}
			{gitError && (
				<TextButton
					size={18}
					icon={ClipboardCopy}
					title={t({ id: 'general.copy_text' })}
					onClick={() => {
						window.navigator.clipboard.writeText(gitError);
						toast.success(t({ id: 'general.copied_to_clipboard' }));
					}}
					className="-m-1 -my-3 !inline-flex translate-y-1 text-inherit"
				/>
			)}
			<div className="-m-2 mt-0 flex justify-end gap-1">
				{/* Unlink remote */}
				<Dialog
					title={t({ id: 'addons.item.delete_confirm' })}
					trigger={
						<TextButton onClick={undefined as never} icon={Unlink} size={18}>
							{t({ id: 'addons.remove_remote' })}
						</TextButton>
					}
					actions={[
						<DialogClose key="delete">
							<TextButton
								icon={Unlink}
								onClick={() => Addons.removeGitRemote(name)}
								className="self-end text-red"
							>
								{t({ id: 'addons.remove_remote' })}
							</TextButton>
						</DialogClose>
					]}
				>
					<p className="whitespace-pre-wrap text-blueGray">
						<FormattedBeMessage
							message={{
								id: 'addons.item.unlink_text',
								values: { span: Wrappers.span, name }
							}}
						/>
					</p>
				</Dialog>

				{/* Change remote */}
				<CustomAddonDialog name={name} />
			</div>
		</>
	);
};

export default AddonRemoteWarning;
