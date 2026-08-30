import { LogOut, RotateCcw, ServerOff, Turtle } from 'lucide-react';

import Preferences from '~/server/stores/preferences';
import useAsyncAction from '~/utils/useAsyncAction';
import Auth from '~/server/stores/auth';
import TextButton from '~/components/styled/TextButton';
import {
	FormattedBeMessage,
	useTranslation,
	Wrappers
} from '~/components/IntlProvider';
import Dialog, { DialogClose } from '~/components/styled/Dialog';
import Context from '~/server/stores/context';

const AccountMenu = () => {
	const t = useTranslation();
	const a = useAsyncAction();

	const offline = Context.useWatch('offline');

	const account = Preferences.useWatch('account') ?? '';

	const region = account.split('@')[1];

	if (offline)
		return (
			<TextButton
				icon={ServerOff}
				type="submit"
				disabled
				className="text-white/90"
			>
				{t({ id: 'general.offline' })}
				{region ? '@' : ''}
				{region}
			</TextButton>
		);

	return (
		<Dialog
			title={t({ id: 'account_menu.account' })}
			trigger={
				<TextButton
					icon={Turtle}
					onClick={undefined as never}
					className="text-white/90"
				>
					{Auth.anonymizeAccount(account)}
				</TextButton>
			}
		>
			<FormattedBeMessage
				message={{
					id: 'account_menu.signed_in_as',
					values: { strong: Wrappers.strong, name: account }
				}}
			/>
			<div className="mt-3 flex flex-col gap-2">
				<TextButton
					icon={RotateCcw}
					onClick={() => {
						Preferences.update({ account: undefined });
						Context.softReload();
					}}
					className="-m-2 mt-0"
				>
					{t({ id: 'account_menu.change_account' })}
				</TextButton>
				<DialogClose>
					<TextButton
						icon={LogOut}
						onClick={a.action(async () => {
							await Auth.signOut();
							Context.softReload();
						})}
						className="-m-2 mt-0"
					>
						{t({ id: 'account_menu.sign_out' })}
					</TextButton>
				</DialogClose>
			</div>
		</Dialog>
	);
};

export default AccountMenu;
