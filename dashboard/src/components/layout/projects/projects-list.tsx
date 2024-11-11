import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { projectsQueryOptions } from '~/lib/queries/project';
import { Project } from '~/types';
import { useProjectModal } from '~/hooks/use-project-modal';
import {
	SidebarMenuSubItem,
} from '~/components/ui/sidebar';
import { ProjectActions } from './project-actions'
import {
	PlusIcon
} from '@radix-ui/react-icons';
import { Button } from '~ui/button';

export function ProjectsList({ isMobile }: { isMobile: boolean }) {
	const { data: projects } = useSuspenseQuery(projectsQueryOptions);
	const hasProjects = projects && projects.length > 0;
	const { openModal } = useProjectModal();
	return (
		<>
			{hasProjects && projects.map((project: Project) => (
				<SidebarMenuSubItem key={project.id} className='flex items-center justify-between'>
					<Link
						to='/projects/$projectId'
						params={{ projectId: project.id }}
						className='flex-1 w-full  text-sm font-normal text-gray-700'
					>
						{isMobile ? project.name.slice(0, 1).toUpperCase() : project.name}
					</Link>
					<ProjectActions project={project} isMobile={isMobile} />
				</SidebarMenuSubItem>
			))}

			<SidebarMenuSubItem>
				<Button
					onClick={() => openModal('create')}
					className='flex items-center gap-2 w-full hover:bg-gray-100 rounded px-1 hover:bg-transparent justify-between text-sm font-normal  bg-transparent text-gray-700 hover:text-gray-800 shadow-none'
				>
					<span>New Project</span>
					<PlusIcon className='h-4 w-4' />
				</Button>
			</SidebarMenuSubItem>
		</>
	);
}