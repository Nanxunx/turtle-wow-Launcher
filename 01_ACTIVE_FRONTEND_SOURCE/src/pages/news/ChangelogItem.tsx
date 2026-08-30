import { MessageCircle, ChevronsUp, ChevronsDown, Scroll } from 'lucide-react';
import { useRef, useState, useMemo } from 'react';
import cls from 'classnames';
import { open } from '@tauri-apps/plugin-shell';

import { useCurrentLocale, useTranslation } from '~/components/IntlProvider';

import { type ForumPostSchema } from '../../utils/schemas';
import { parseBbCode } from '../../utils/bbCode';
import TextButton from '../../components/styled/TextButton';

const emojiRegex = /(\p{Extended_Pictographic}(?:\uFE0F)?)/gu;

const ChangelogItem = (post: ForumPostSchema) => {
	const loc = useCurrentLocale();
	const t = useTranslation();

	const ref = useRef<HTMLDivElement>(null);
	const [expanded, setExpanded] = useState(false);

	const parsedText = useMemo(
		() => (!expanded ? [] : parseBbCode(post.text)),
		[expanded, post.text]
	);

	const title = useMemo(
		() => post.title.replace(emojiRegex, match => `<span>${match}</span>`),
		[post.title]
	);

	const date = new Date(post.postedAt);

	return (
		<article
			ref={ref}
			className={cls(
				'relative flex flex-col gap-3 px-3 py-2 hocus:bg-darkPurple/30',
				!expanded && 'overflow-hidden'
			)}
		>
			<h3
				className="tw-color -mb-3"
				dangerouslySetInnerHTML={{ __html: title }}
			/>
			<p className="self-start text-blueGray">
				{date.toLocaleDateString(loc)} {date.toLocaleTimeString(loc)}
			</p>

			{post.image ? (
				<img src={post.image} alt={post.title} />
			) : (
				<Scroll className="mx-auto my-3 size-5 text-blueGray" />
			)}
			{expanded && (
				<div className="overflow-hidden whitespace-pre-wrap">{parsedText}</div>
			)}

			<div className={cls('flex', expanded && 'sticky bottom-4')}>
				<div className="bg-darkGray/80">
					<TextButton
						icon={MessageCircle}
						onClick={() => open(post.url)}
						size={20}
						className="!gap-1"
					>
						{post.comments}
					</TextButton>
				</div>
				<div className="grow" />
				<div className="bg-darkGray/80">
					<TextButton
						icon={expanded ? ChevronsUp : ChevronsDown}
						onClick={() => {
							ref.current?.scrollIntoView({ behavior: 'smooth' });
							setExpanded(v => !v);
						}}
						size={20}
						className="!gap-1 !pr-[12px]"
					>
						{t({ id: expanded ? 'news.collapse' : 'news.expand' })}
					</TextButton>
				</div>
			</div>
		</article>
	);
};
export default ChangelogItem;
