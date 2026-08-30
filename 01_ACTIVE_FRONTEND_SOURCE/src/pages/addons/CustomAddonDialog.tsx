import { Check, DownloadCloud, Link, Plus, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';

import {
	FormattedBeMessage,
	useCurrentLocaleShort,
	useTranslation
} from '~/components/IntlProvider';
import Input from '~/components/form/Input';
import Dialog from '~/components/styled/Dialog';
import useQuery from '~/utils/useQuery';
import Addons, { localizedTocField } from '~/server/modules/addons';
import useScrollHint from '~/utils/useScrollHint';
import { ColoredText } from '~/components/styled/ColoredText';

import IconSpinner from '../../components/styled/IconSpinner';
import TextButton from '../../components/styled/TextButton';

import AddonAside from './AddonAside';
import AddonDescription from './AddonDescription';

const useDebounced = (value: string, delay: number) => {
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(() => {
		const timeout = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(timeout);
	}, [value, delay]);

	return debouncedValue;
};

const CustomAddonDialog = (previous: { name?: string }) => {
	const loc = useCurrentLocaleShort();
	const t = useTranslation();

	const [open, setOpen] = useState(false);

	const [url, setUrl] = useState('');
	const debouncedUrl = useDebounced(url, 500);

	const addon = useQuery({
		args: [debouncedUrl],
		query: Addons.fetchAddonData,
		disabled: !open
	});

	const scrollRef = useScrollHint<HTMLDivElement>([addon.data?.git]);

	const tocName = useMemo(
		() => `${addon.data?.git.split('/').at(-1)?.slice(0, -4)}.toc`,
		[addon.data?.git]
	);

	const toc = useQuery({
		args: [addon.data, tocName, Addons.parseToc],
		query: Addons.getGithubFile,
		disabled: !open
	});

	const onOpenChange = (open: boolean) => {
		setOpen(open);
		if (!open) setUrl('');
	};

	const errorMessage = !addon.data
		? t({ id: 'addons.custom.invalid' })
		: previous.name && previous.name !== addon.data.name
		? t({ id: 'addons.custom.name_mismatch' })
		: undefined;

	return (
		<Dialog
			type="controlled"
			open={open}
			onOpenChange={onOpenChange}
			noScroll
			title={t({
				id: previous.name ? 'addons.change_remote' : 'addons.add_custom'
			})}
			trigger={
				previous.name ? (
					<TextButton onClick={undefined as never} icon={Link} size={18}>
						{t({ id: 'addons.change_remote' })}
					</TextButton>
				) : (
					<TextButton
						icon={Plus}
						size={18}
						onClick={undefined as never}
						className="text-sm text-pink"
					>
						{t({ id: 'addons.add_custom' })}
					</TextButton>
				)
			}
			actions={[
				<p key="err" className="text-sm text-blueGray">
					{!url ? null : errorMessage ?? t({ id: 'addons.custom.ready' })}
				</p>,
				previous.name ? (
					<TextButton
						key="install"
						icon={Link}
						onClick={() => Addons.changeGitRemote(previous.name ?? '', url)}
						size={18}
						className={!errorMessage ? 'text-warmGreen' : 'text-blueGray'}
						disabled={!!errorMessage || addon.loading}
					>
						{t({ id: 'addons.change_remote' })}
					</TextButton>
				) : (
					<TextButton
						key="install"
						icon={DownloadCloud}
						onClick={() => {
							if (!addon.data) return;
							Addons.install(addon.data);
							onOpenChange(false);
						}}
						className={!errorMessage ? 'text-warmGreen' : 'text-blueGray'}
						disabled={!!errorMessage || addon.loading}
					>
						{t({ id: 'addons.custom.install' })}
					</TextButton>
				)
			]}
		>
			<div ref={scrollRef} className="-m-3 overflow-auto p-3">
				{toc.data && (
					<AddonAside git={addon.data?.git ?? ''} toc={toc.data ?? {}} />
				)}
				<AddonDescription
					key={addon.data?.git}
					addon={addon.data}
					disabled={!open}
					fallback={
						toc.data ? (
							<ColoredText className="mb-3">
								{localizedTocField(toc.data, 'Notes', loc)}
							</ColoredText>
						) : null
					}
				/>
			</div>

			{(addon.data || toc.data) && <hr />}

			<Input
				placeholder={t({ id: 'addons.custom.instructions' })}
				value={url}
				onChange={e => setUrl(e.currentTarget.value ?? '')}
				iconBefore={
					addon.loading ? (
						<IconSpinner size={18} />
					) : errorMessage ? (
						<X size={18} className="text-blueGray" />
					) : (
						<Check size={18} className="text-warmGreen" />
					)
				}
			/>

			<p className="text-sm text-blueGray">
				<FormattedBeMessage
					message={{
						id: 'addons.custom.wiki',
						values: {
							link: (children: ReactNode) => (
								<TextButton
									onClick={() =>
										openUrl('https://turtle-wow.fandom.com/wiki/Addons')
									}
									className="!inline-block !p-0 text-inherit underline"
								>
									{children}
								</TextButton>
							)
						}
					}}
				/>
			</p>
		</Dialog>
	);
};

export default CustomAddonDialog;
