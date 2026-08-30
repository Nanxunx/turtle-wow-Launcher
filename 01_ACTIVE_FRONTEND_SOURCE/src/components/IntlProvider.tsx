/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { ReactCountryFlag } from 'react-country-flag';
import {
	FormattedMessage,
	IntlProvider as Provider,
	useIntl
} from 'react-intl';
import { Languages } from 'lucide-react';
import * as fs from '@tauri-apps/plugin-fs';

import TextButton from '~/components/styled/TextButton';
import Preferences, {
	type PreferencesSchema
} from '~/server/stores/preferences';
import { TopBarButtonSize, type LocalizedMessage } from '~/utils';
import * as locales from '~/locales';
import Context from '~/server/stores/context';
import Updater from '~/server/modules/updater';
import { path, safeRename } from '~/server/utils';

import Dialog from './styled/Dialog';

type Props = { message?: LocalizedMessage };

const FormMess = FormattedMessage as any;
const Prov = Provider as any;

export const FormattedBeMessage = ({ message }: Props) =>
	!message || typeof message === 'string' ? (
		message?.startsWith('#') ? (
			<FormMess id={message.slice(1)} />
		) : (
			message
		)
	) : (
		<FormMess {...message} />
	);

export const Wrappers = {
	span: (v: ReactNode[]) => <span>{v}</span>,
	error: (v: ReactNode[]) => <span className="text-orange">{v}</span>,
	strong: (v: ReactNode[]) => (
		<span className="text-lg font-bold text-pink">{v}</span>
	),
	code: (v: ReactNode[]) => <span className="font-mono text-yellow">{v}</span>
} as const;

export const useCurrentLocale = () => {
	const lng = Preferences.useWatch('language');
	return lng === 'en'
		? 'en-US'
		: lng === 'cn'
		? 'zh-CN'
		: lng === 'es'
		? 'es-ES'
		: lng;
};

export const useCurrentLocaleShort = () => {
	const lng = Preferences.useWatch('language');
	switch (lng) {
		case 'cn':
			return 'zhCN';
		case 'es':
			return 'esES';
		case 'pt':
			return 'ptPT';
		case 'de':
			return 'deDE';
		case 'ru':
			return 'ruRU';
		default:
			return undefined;
	}
};

const changeLocale = async (language: PreferencesSchema['language']) => {
	const previous = Preferences.get().language;
	if (language === previous) return;

	const dataPath = Preferences.pathTo('data');
	const localePatchPath = path.join(dataPath, 'patch-Z.mpq');

	// Cache old locale patch file
	const oldCachedPath = Preferences.fileCachePath(`locale_${previous}`);
	if (await fs.exists(localePatchPath))
		await safeRename(localePatchPath, oldCachedPath);

	// Restore cached locale patch file
	const newCachedPath = Preferences.fileCachePath(`locale_${language}`);
	if (await fs.exists(newCachedPath))
		await safeRename(newCachedPath, localePatchPath);

	Preferences.update({ language });
	Context.softReload();
};

const LanguagesMeta = [
	['en', 'GB', 'English'],
	['cn', 'CN', 'Chinese'],
	['es', 'ES', 'Spanish'],
	['pt', 'BR', 'Portuguese'],
	['de', 'DE', 'German'],
	['ru', 'RU', 'Russian']
] as const;

export const LanguageSelect = () => {
	const t = useTranslation();
	const language = Preferences.useWatch('language');
	return (
		<div>
			<h4>{t({ id: 'general.language' })}</h4>
			<div className="flex items-center">
				{LanguagesMeta.map(([code, flag, name]) => (
					<TextButton
						key={code}
						className={language === code ? 'text-white' : 'text-blueGray'}
						icon={
							(() => (
								<ReactCountryFlag
									countryCode={flag}
									svg
									className="cursor-[inherit]"
								/>
							)) as never
						}
						onClick={() => changeLocale(code)}
					>
						{name}
					</TextButton>
				))}
			</div>
			<p className="text-sm text-blueGray">
				{t({ id: 'general.language_info' })}
			</p>
		</div>
	);
};

export const LanguageDialog = () => {
	const t = useTranslation();
	const firstTimeSetUp = !Preferences.useWatch('mirror');
	const language = Preferences.useWatch('language');
	const isUpdating = Updater.useIsUpdating();
	const [open, setOpen] = useState(false);

	return (
		<Dialog
			type="controlled"
			open={open}
			onOpenChange={setOpen}
			title={t({ id: 'general.language' })}
			trigger={
				<TextButton
					onClick={undefined as never}
					icon={Languages}
					title={t({ id: 'top_bar.language' })}
					size={TopBarButtonSize}
					disabled={isUpdating || firstTimeSetUp}
					className="!p-1"
				/>
			}
		>
			<div className="flex items-center">
				{LanguagesMeta.map(([code, flag, name]) => (
					<TextButton
						key={code}
						className={language === code ? 'text-white' : 'text-blueGray'}
						icon={
							(() => (
								<ReactCountryFlag
									countryCode={flag}
									svg
									className="cursor-[inherit]"
								/>
							)) as never
						}
						onClick={() => {
							changeLocale(code);
							setOpen(false);
						}}
					>
						{name}
					</TextButton>
				))}
			</div>
			<p className="mt-2 text-sm text-blueGray">
				{t({ id: 'general.language_info' })}
			</p>
		</Dialog>
	);
};

export const useTranslation = () => useIntl().formatMessage;

export let t: ReturnType<typeof useIntl>['formatMessage'] = (...args) =>
	(args[0].id ?? '') as never;

const IntlRefCatcher = () => {
	// eslint-disable-next-line react-compiler/react-compiler
	t = useIntl().formatMessage;
	return null;
};

const IntlProvider = ({ children }: PropsWithChildren) => {
	const language = Preferences.useWatch('language');
	return (
		<Prov messages={(locales as any)[language]} locale={language}>
			{children}
			<IntlRefCatcher />
		</Prov>
	);
};

export default IntlProvider;
