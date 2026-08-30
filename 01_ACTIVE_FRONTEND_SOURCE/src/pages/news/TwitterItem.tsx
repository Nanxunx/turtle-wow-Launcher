import { MessageCircle, Heart, Play } from 'lucide-react';
import { useRef } from 'react';
import { open } from '@tauri-apps/plugin-shell';

import { useCurrentLocale } from '~/components/IntlProvider';

import { type TwitterPostSchema } from '../../utils/schemas';
import ImagePreview from '../../components/styled/ImagePreview';
import TextButton from '../../components/styled/TextButton';

const TwitterItem = (post: TwitterPostSchema) => {
	const loc = useCurrentLocale();
	const ref = useRef<HTMLDivElement>(null);

	const date = new Date(post.postedAt);
	return (
		<article ref={ref} className="relative px-3 py-2 hocus:bg-darkPurple/30">
			<div className="flex flex-col items-center gap-3 overflow-hidden">
				<p className="-mb-1 self-start text-blueGray">
					{date.toLocaleDateString(loc)} {date.toLocaleTimeString(loc)}
				</p>
				<p className="self-start whitespace-pre-wrap">
					{post.text.map((t, i, arr) =>
						typeof t !== 'string' ? (
							<button
								key={i}
								onClick={() => open(t.url)}
								className="inline cursor-pointer underline"
							>
								{t.display_url}
							</button>
						) : i === arr.length - 1 ? (
							t.trimEnd()
						) : (
							t
						)
					)}
				</p>
				{post.media?.map(m =>
					m.videoUrl ? (
						<button
							key={m.videoUrl}
							onClick={() => open(m.videoUrl ?? '')}
							className="relative w-full cursor-pointer text-white/40 hover:text-white"
						>
							{m.imageUrl ? (
								<img
									src={m.imageUrl}
									alt={m.title}
									className="cursor-pointer"
								/>
							) : (
								<div className="flex aspect-video w-full cursor-pointer items-center justify-center border-2 border-white/40 p-3 text-center text-white/40">
									{m.title}
								</div>
							)}
							<Play
								size={62}
								className="absolute right-1/2 top-1/2 -translate-y-1/2 translate-x-1/2"
							/>
						</button>
					) : m.imageUrl ? (
						<ImagePreview key={m.imageUrl} src={m.imageUrl} />
					) : null
				)}
			</div>

			<div className="flex gap-2 pt-2">
				<div className="bg-darkGray/80">
					<TextButton
						icon={MessageCircle}
						onClick={() => open(post.url)}
						size={20}
						className="!gap-1"
					>
						{post.replies}
					</TextButton>
				</div>
				<div className="bg-darkGray/80">
					<TextButton
						icon={Heart}
						onClick={() => open(post.url)}
						size={20}
						className="!gap-1"
					>
						{post.likes}
					</TextButton>
				</div>
			</div>
		</article>
	);
};
export default TwitterItem;
