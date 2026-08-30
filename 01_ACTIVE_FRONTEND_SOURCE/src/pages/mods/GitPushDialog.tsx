import {
	CloudUpload,
	FileMinus2,
	FilePen,
	FilePlus2,
	FileQuestion,
	FileX,
	type LucideIcon
} from 'lucide-react';
import { useState } from 'react';

import Input from '~/components/form/Input';
import Dialog, { DialogClose } from '~/components/styled/Dialog';
import TextButton from '~/components/styled/TextButton';
import { type RepositoryInfo } from '~/server/modules/ipc';
import useScrollHint from '~/utils/useScrollHint';

const meta = {
	conflicted: { Icon: FileX, color: 'pink' },
	untracked: { Icon: FilePlus2, color: 'warmGreen' },
	modified: { Icon: FilePen, color: 'yellow' },
	deleted: { Icon: FileMinus2, color: 'red' },
	renamed: { Icon: FilePen, color: 'orange' },
	other: { Icon: FileQuestion, color: 'blueGray' }
} satisfies Record<
	RepositoryInfo['changes'][string],
	{ Icon: LucideIcon; color: string }
>;

const GitChangeItem = ({
	name,
	status
}: {
	name: string;
	status: RepositoryInfo['changes'][string];
}) => {
	const { Icon, color } = meta[status];
	return (
		<div className="flex min-w-0 shrink-0 items-center gap-2 overflow-x-hidden whitespace-nowrap px-3 py-1 hover:bg-darkPurple/50">
			<Icon size={16} className={`text- -mr-1 shrink-0 text-${color}`} />
			<span className={`text-sm text-${color}`}>{status}</span>
			<span className="shrink overflow-hidden text-ellipsis font-mono">
				{name}
			</span>
		</div>
	);
};

const SummaryKeys = ['with_conflicts', 'added', 'modified', 'deleted'] as const;
const SummaryInfo = {
	with_conflicts: { className: 'text-red font-bold', prefix: '!!' },
	added: { className: 'text-green', prefix: '++' },
	modified: { className: 'text-warmGreen', prefix: '~~' },
	deleted: { className: 'text-red', prefix: '--' }
} satisfies Record<
	(typeof SummaryKeys)[number],
	{ className: string; prefix: string }
>;

type Props = {
	changes: RepositoryInfo['changes'];
	onPush: (message: string) => void;
	disabled: boolean;
};

const GitPushDialog = ({ changes, onPush, disabled }: Props) => {
	const scrollRef = useScrollHint<HTMLDivElement>();

	const [message, setMessage] = useState('');
	const hasConflicts = Object.values(changes).some(s => s === 'conflicted');

	const sum: Record<(typeof SummaryKeys)[number], number> = Object.values(
		changes
	).reduce(
		(acc, status) => {
			if (status === 'untracked') acc.added++;
			else if (status === 'modified') acc.modified++;
			else if (status === 'conflicted') acc.with_conflicts++;
			else if (status === 'deleted') acc.deleted++;
			return acc;
		},
		{ with_conflicts: 0, added: 0, modified: 0, deleted: 0 }
	);

	return (
		<Dialog
			title="Push changes"
			trigger={
				<TextButton
					icon={CloudUpload}
					size={18}
					onClick={undefined as never}
					disabled={disabled}
					className="text-sm"
				>
					Push
				</TextButton>
			}
			actions={[
				hasConflicts && (
					<p key="conflicts" className="text-red">
						There are conflicts, please resolve them manually before pushing.
					</p>
				),
				<DialogClose key="submit">
					<TextButton
						icon={CloudUpload}
						onClick={() => onPush(message)}
						disabled={disabled || hasConflicts}
					>
						Push
					</TextButton>
				</DialogClose>
			]}
			noScroll
			className="w-full"
		>
			<Input
				value={message}
				onChange={e => setMessage(e.currentTarget.value)}
				placeholder="Commit message"
			/>

			<div className="-mb-2 flex items-center gap-2">
				<h4 className="grow">Changes:</h4>

				{SummaryKeys.map(key =>
					sum[key] ? (
						<span
							key={key}
							title={`${sum[key]} files ${key.replace('_', ' ')}`}
							className={SummaryInfo[key].className}
						>
							{SummaryInfo[key].prefix}
							{sum[key]}
						</span>
					) : null
				)}
			</div>

			<hr />

			<div
				ref={scrollRef}
				className="-m-3 flex max-h-[50vh] min-h-0 flex-col overflow-auto"
			>
				{Object.entries(changes).map(([name, status]) => (
					<GitChangeItem key={name} name={name} status={status} />
				))}
			</div>
		</Dialog>
	);
};

export default GitPushDialog;
