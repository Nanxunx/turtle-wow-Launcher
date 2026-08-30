import { openUrl } from '@tauri-apps/plugin-opener';
import { type ReactNode, type HTMLProps } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import IconSpinner from '~/components/styled/IconSpinner';
import ImagePreview from '~/components/styled/ImagePreview';
import TextButton from '~/components/styled/TextButton';
import Addons from '~/server/modules/addons';
import { type AvailableAddon } from '~/server/modules/api';
import useQuery from '~/utils/useQuery';

const ImageComponent = ({ src, ...props }: HTMLProps<HTMLImageElement>) =>
	src ? <ImagePreview src={src} {...props} /> : null;

const LinkComponent = ({ href, children }: HTMLProps<HTMLAnchorElement>) =>
	href ? (
		<TextButton
			onClick={() => openUrl(href)}
			className="-m-2 inline-flex text-yellow underline"
		>
			{children}
		</TextButton>
	) : null;

type Props = {
	addon?: Partial<AvailableAddon>;
	disabled?: boolean;
	fallback?: ReactNode;
};

const transform = async (v: string) => v;

const AddonDescription = ({ addon, disabled, fallback }: Props) => {
	const readme = useQuery({
		args: [addon, 'README.md', transform],
		query: Addons.getGithubFile,
		disabled: !addon?.git || disabled
	});

	const url = addon?.git
		? `${addon?.git.slice(0, -4)}/raw/${addon?.gitRef ?? 'HEAD'}/`
		: undefined;

	if (!readme.data)
		return (
			<>
				{fallback}
				{readme.loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-darkGray/40">
						<IconSpinner size={38} />
					</div>
				)}
			</>
		);

	return (
		<Markdown
			rehypePlugins={[rehypeRaw]}
			components={{ img: ImageComponent, a: LinkComponent }}
			urlTransform={u => (url ? new URL(u, url).href : u)}
			className="markdown"
		>
			{readme.data}
		</Markdown>
	);
};

export default AddonDescription;
