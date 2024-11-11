import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { projectsQueryOptions } from '~/lib/queries/project';
import { Suspense } from 'react';
import { ProjectCard } from '~components/pages/projects/project-card';
import { ProjectsGrid } from '~components/pages/projects/loading';
import { ProjectsErrorComponent } from '~components/pages/projects/error';
import { Button } from '~ui/button';
import { PlusCircle, FolderPlus } from 'lucide-react';
import { useProjectModal } from '~/hooks/use-project-modal';

function EmptyState() {
	const { openModal } = useProjectModal();

	return (
		<div className="flex flex-col items-center justify-center min-h-full rounded-lg border-2 border-dashed border-muted p-8 text-center animate-in fade-in-50">
			<div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
				<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
					<FolderPlus className="h-10 w-10 text-muted-foreground" />
				</div>
				<h3 className="mt-4 text-lg font-semibold">No projects created</h3>
				<p className="mb-4 mt-2 text-sm text-muted-foreground">
					You haven't created any projects yet. Create your first project to get started.
				</p>
				<Button onClick={() => openModal('create')} className="gap-2">
					<PlusCircle className="h-4 w-4" />
					Create Project
				</Button>
			</div>
		</div>
	);
}

export const Route = createFileRoute('/_auth/projects')({
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(projectsQueryOptions),
	component: ProjectsComponent,
	errorComponent: ProjectsErrorComponent,
});

function ProjectsComponent() {
	const { data: projects } = useSuspenseQuery(projectsQueryOptions);
	const matches = useMatches();
	const isProjectsRoot = matches[matches.length - 1].routeId === '/_auth/projects';

	return (
		<div className='p-2'>
			{isProjectsRoot && (
				<Suspense fallback={<ProjectsGrid />}>
					{projects.length === 0 ? (
						<EmptyState />
					) : (
						<div className='flex flex-row flex-wrap gap-4'>
							{projects.map((project) => (
								<ProjectCard key={project.id} project={project} />
							))}
						</div>
					)}
				</Suspense>
			)}
			<Outlet />
		</div>
	);
}

