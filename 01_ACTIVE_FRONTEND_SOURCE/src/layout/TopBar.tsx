import { LogOut, Minus, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

import PreferencesDialog from '~/components/settings/PreferencesDialog';
import TextButton from '~/components/styled/TextButton';
import { LanguageDialog, useTranslation } from '~/components/IntlProvider';
import Dialog, { DialogClose } from '~/components/styled/Dialog';
import { TopBarButtonSize } from '~/utils';
import Window from '~/server/window';

const TopBar = () => {
	const t = useTranslation();

	return (
		<div className="absolute -left-1 -right-1 -top-1 flex pr-2 pt-2 opacity-80">
			<div data-tauri-drag-region className="-mt-2 grow" />
			<LanguageDialog />
			<PreferencesDialog />
			<TextButton
				icon={Minus}
				title={t({ id: 'top_bar.minimize' })}
				onClick={Window.hide}
				size={TopBarButtonSize}
				className="!p-1"
			/>
			<Dialog
				title={t({ id: 'top_bar.quit_title' })}
				trigger={
					<TextButton
						icon={X}
						title={t({ id: 'top_bar.quit' })}
						onClick={Window.close}
						size={TopBarButtonSize}
						className="!p-1 hocus:text-red"
					/>
				}
				actions={[
					<DialogClose key="return">
						<TextButton icon={X} type="submit">
							{t({ id: 'top_bar.return' })}
						</TextButton>
					</DialogClose>,
					<TextButton
						key="quit"
						icon={LogOut}
						onClick={() => getCurrentWindow().close()}
						className="text-red"
					>
						{t({ id: 'top_bar.quit' })}
					</TextButton>
				]}
			>
				<p className="text-blueGray">{t({ id: 'top_bar.quit_warning' })}</p>
			</Dialog>
		</div>
	);
};

export default TopBar;
