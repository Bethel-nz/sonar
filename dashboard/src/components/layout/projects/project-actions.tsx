import { useProjectModal } from '~/hooks/use-project-modal';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
	DotsHorizontalIcon,
	Pencil1Icon,
	TrashIcon
} from '@radix-ui/react-icons';
import { Project } from '~types';
import { cx } from '~utils';
import { Button } from '~ui/button';


export function ProjectActions({ project, isMobile }: { project: Project; isMobile?: boolean }) {
	const { openModal } = useProjectModal();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className={cx(
					'p-1 hover:bg-gray-100 rounded bg-transparent text-gray-800 shadow-none h-fit',
					isMobile && 'absolute right-0 rotate-90'
				)}>
					<DotsHorizontalIcon className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className={isMobile ? 'w-32' : 'w-40'}>
				<DropdownMenuItem onClick={() => openModal('edit', project)}>
					<Pencil1Icon className="h-4 w-4 mr-2" />
					<span>Edit</span>
				</DropdownMenuItem>

				<DropdownMenuItem
					className='text-red-600'
					onClick={() => openModal('delete', project)}
				>
					<TrashIcon className="h-4 w-4 mr-2" />
					<span>Delete</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}


