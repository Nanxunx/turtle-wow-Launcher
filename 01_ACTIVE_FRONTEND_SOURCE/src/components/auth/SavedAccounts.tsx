import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	LogOut
} from 'lucide-react';
import { useState } from 'react';

import TextButton from '~/components/styled/TextButton';
import { useTranslation } from '~/components/IntlProvider';
import useAsyncAction from '~/utils/useAsyncAction';
import Auth from '~/server/stores/auth';
import Preferences from '~/server/stores/preferences';
import Context from '~/server/stores/context';

const SavedAccounts = () => {
	const t = useTranslation();
	const a = useAsyncAction();

	const savedAccounts = Preferences.useWatch('savedAccounts');

	const moveAccount = (account: string, direction: 'up' | 'down') => {
		const idx = savedAccounts.indexOf(account);
		const newIdx = direction === 'up' ? idx - 1 : idx + 1;

		const newAccounts = [...savedAccounts];
		newAccounts.splice(idx, 1);
		newAccounts.splice(newIdx, 0, account);

		Preferences.update({ savedAccounts: newAccounts });
	};

	const [page, setPage] = useState(0);

	if (!savedAccounts.length) return null;

	const accounts = [...savedAccounts.values()];

	return (
		<div className="absolute -right-1 top-[-1px] translate-x-full">
			<div className="tw-dialog">
				<div className="flex items-center justify-between gap-2">
					<h4 className="tw-color -my-1">
						{t({ id: 'sign_in.saved_accounts' })}
					</h4>

					{accounts.length > 6 && (
						<div className="-m-2 flex">
							<TextButton
								icon={ChevronLeft}
								size={18}
								title={t({ id: 'general.previous' })}
								onClick={() => setPage(page - 6 < 0 ? 0 : page - 6)}
								disabled={page === 0}
							/>
							<TextButton
								icon={ChevronRight}
								size={18}
								title={t({ id: 'general.next' })}
								onClick={() =>
									setPage(page + 6 > accounts.length ? page : page + 6)
								}
								disabled={page + 6 >= accounts.length}
							/>
						</div>
					)}
				</div>

				<hr />

				{accounts.slice(page, page + 6).map(account => (
					<div key={account} className="-m-2 flex items-center">
						<div className="-mx-1">
							<TextButton
								icon={ChevronUp}
								size={12}
								title={t({ id: 'general.up' })}
								onClick={() => moveAccount(account, 'up')}
								disabled={a.loading}
								className="pb-0"
							/>
							<TextButton
								icon={ChevronDown}
								size={12}
								title={t({ id: 'general.down' })}
								onClick={() => moveAccount(account, 'down')}
								disabled={a.loading}
								className="pt-0"
							/>
						</div>
						<TextButton
							disabled={a.loading}
							onClick={() => {
								Preferences.update({ account });
								Context.softReload();
							}}
							className="-mx-1 grow"
						>
							{account}
						</TextButton>
						<TextButton
							icon={LogOut}
							size={18}
							title={t({ id: 'account_menu.sign_out' })}
							onClick={a.action(() => Auth.signOut(account))}
							disabled={a.loading}
							className="text-red"
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default SavedAccounts;
