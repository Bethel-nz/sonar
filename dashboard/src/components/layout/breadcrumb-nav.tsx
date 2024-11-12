import { Link, useMatches } from '@tanstack/react-router';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~ui/breadcrumb';
import { useProject } from '~/lib/queries/projects';
import { useWorkflow } from '~/lib/queries/workflows';

export function BreadcrumbNav() {
	const matches = useMatches();
	const currentRoute = matches[matches.length - 1];

	// Check if we're on a workflow route and have a workflow name
	const isWorkflowRoute = currentRoute.routeId.includes('workflows');
	const params = currentRoute.params as { projectId?: string; workflowName?: string };

	// Only proceed if we have the required params
	const projectId = params.projectId;
	const workflowName = params.workflowName;

	// Only fetch project if we have a projectId
	const { data: project } = useProject(projectId ?? '', {
		enabled: !!projectId
	});

	// Only fetch workflow data if we're on a workflow route AND have both params
	const { data: workflow } = useWorkflow(projectId ?? '', workflowName ?? '', {
		enabled: isWorkflowRoute && !!projectId && !!workflowName
	});

	// Build breadcrumb items
	const breadcrumbItems = [
		{
			label: 'Projects',
			path: '/projects',
			current: false
		}
	];

	if (project && projectId) {
		breadcrumbItems.push({
			label: project.name,
			path: `/projects/${projectId}`,
			current: !isWorkflowRoute
		});
	}

	if (workflow && workflowName && isWorkflowRoute) {
		breadcrumbItems.push({
			label: workflow.name,
			path: `/projects/${projectId}/workflows/${workflowName}`,
			current: true
		});
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbItems.map((item, index) => (
					<BreadcrumbItem key={item.path}>
						{index > 0 && <BreadcrumbSeparator />}
						{item.current ? (
							<BreadcrumbPage>{item.label}</BreadcrumbPage>
						) : (
							<BreadcrumbLink asChild>
								<Link to={item.path}>{item.label}</Link>
							</BreadcrumbLink>
						)}
					</BreadcrumbItem>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
} 