import { FolderOpen, PackagePlus } from 'lucide-react';
import { useState } from 'react';
import { open as openFilePicker } from '@tauri-apps/plugin-dialog';

import Input from '~/components/form/Input';
import Dialog from '~/components/styled/Dialog';
import Preferences from '~/server/stores/preferences';

import TextButton from '../../components/styled/TextButton';
import { Mods } from '~/server/stores/mods';

type Props = { refetch: () => void };

const DevPatchDialog = ({ refetch }: Props) => {
	const [open, setOpen] = useState(false);

	const [name, setName] = useState('');
	const [folder, setFolder] = useState('');

	const error = !name || !folder ? 'Both patch name and path are required' : '';

	const onOpenChange = (open: boolean) => {
		if (!open) {
			setName('');
			setFolder('');
		}
		setOpen(open);
	};

	return (
		<Dialog
			type="controlled"
			open={open}
			onOpenChange={onOpenChange}
			noScroll
			title="Development patch"
			trigger={
				<TextButton
					onClick={undefined as never}
					size={18}
					icon={PackagePlus}
					className="-my-2"
				>
					Add patch
				</TextButton>
			}
			actions={[
				<p key="err" className="text-sm text-blueGray">
					{error}
				</p>,
				<TextButton
					key="install"
					icon={PackagePlus}
					onClick={() => {
						if (error) return;
						Mods.addDevMPQ({ name, folder, override: false, auto: false });
						refetch();
						onOpenChange(false);
					}}
					disabled={!!error}
				>
					Add
				</TextButton>
			]}
			className="w-full"
		>
			<div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
				<p className="text-right">Directory path:</p>
				<Input
					value={folder}
					iconAfter={
						<TextButton
							icon={FolderOpen}
							title="Select folder"
							onClick={async () => {
								const file = await openFilePicker({
									defaultPath: Preferences.pathTo('data'),
									directory: true,
									canCreateDirectories: true
								});
								if (!file) return;
								setFolder(file);
							}}
							className="-mx-1 -my-2 text-sm"
						/>
					}
					className="col-span-2 grow"
				/>

				<p className="text-right">Patch name:</p>
				<Input
					value={name}
					onChange={e =>
						setName((e.currentTarget.value[0] ?? '').toLocaleUpperCase())
					}
					iconBefore={
						<span className="cursor-[inherit] text-blueGray">patch-</span>
					}
					iconAfter={
						<span className="cursor-[inherit] text-blueGray">.mpq</span>
					}
					className="[&>input]:-mx-2 [&>input]:w-3 [&>input]:px-0 [&>input]:text-center"
				/>
			</div>
		</Dialog>
	);
};

export default DevPatchDialog;
