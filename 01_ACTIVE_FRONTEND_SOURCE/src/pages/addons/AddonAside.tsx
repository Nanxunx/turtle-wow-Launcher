import { Check, Dot, DownloadCloud, ExternalLink, X } from 'lucide-react';
import { openPath, openUrl } from '@tauri-apps/plugin-opener';
import { type PropsWithChildren } from 'react';

import { useTranslation } from '~/components/IntlProvider';
import Addons, {
	type AddonDependency,
	type AddonToc
} from '~/server/modules/addons';
import TextButton from '~/components/styled/TextButton';
import IconSpinner from '~/components/styled/IconSpinner';
import { ColoredText } from '~/components/styled/ColoredText';

export const AddonDetailItem = ({
	name,
	children
}: PropsWithChildren<{ name: string }>) =>
	children ? (
		<div className="pl-4 -indent-4 text-sm text-blueGray">
			{name}{' '}
			{typeof children === 'string' ? (
				<ColoredText className="inline">{children}</ColoredText>
			) : (
				children
			)}
		</div>
	) : null;

const AddonSide = ({
	folder,
	git,
	toc,
	dependencies
}: {
	folder?: string;
	git: string;
	toc?: AddonToc;
	dependencies?: AddonDependency[];
}) => {
	const t = useTranslation();
	return (
		<div className="tw-surface float-right mb-3 ml-3 max-w-[300px] p-3 py-2">
			{folder && (
				<AddonDetailItem name={t({ id: 'addons.detail.files' })}>
					<TextButton
						onClick={() => openPath(folder)}
						className="-m-2 !inline-flex items-center"
					>
						{t({ id: 'general.open_folder' })}{' '}
						<ExternalLink size={16} className="inline" />
					</TextButton>
				</AddonDetailItem>
			)}
			{git && (
				<AddonDetailItem name={t({ id: 'addons.detail.source' })}>
					<TextButton
						onClick={() => git && openUrl(git)}
						className="-m-2 !inline-flex items-center"
					>
						{t({ id: 'addons.detail.open_git' })}{' '}
						<ExternalLink size={16} className="inline" />
					</TextButton>
				</AddonDetailItem>
			)}

			<AddonDetailItem name={t({ id: 'addons.detail.contributions' })}>
				{toc?.Author}
			</AddonDetailItem>

			<AddonDetailItem name={t({ id: 'addons.detail.version' })}>
				{toc?.Version}
			</AddonDetailItem>

			{!!dependencies?.length && (
				<AddonDetailItem name={t({ id: 'addons.detail.dependencies' })}>
					<ul className="pl-2">
						{dependencies.map(dep => (
							<li key={dep.name}>
								{dep.status === 'installed' ? (
									<Check size={16} className="inline text-darkGreen" />
								) : dep.status === 'available' ? (
									<TextButton
										title={t({ id: 'general.download' })}
										icon={DownloadCloud}
										size={16}
										onClick={async () => Addons.install(dep)}
										className="-m-2 !inline translate-y-1 text-warmGreen"
									/>
								) : dep.status === 'missing' ? (
									dep.optional ? (
										<Dot size={16} className="inline text-blueGray" />
									) : (
										<X size={16} className="inline text-red" />
									)
								) : (
									<IconSpinner size={16} className="inline" />
								)}
								<p className="inline"> {dep.name} </p>
								{dep.optional ? (
									<p className="inline text-sm text-blueGray">
										{t({ id: 'addons.detail.optional' })}
									</p>
								) : null}
							</li>
						))}
					</ul>
				</AddonDetailItem>
			)}
		</div>
	);
};

export default AddonSide;
