import { createFileRoute, useMatches } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '~ui/card';
import { ChartContainer, ChartTooltip } from '~ui/charts';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
	Copy, ExternalLink, Github
} from 'lucide-react';
import { Button } from "~ui/button";
import { notify } from "~ui/sonner";
import { WorkflowsTable } from '~/components/pages/projects/workflows-table';
import { ProjectDetailSkeleton } from '~/components/pages/projects/loading';
import { ProjectDetailError } from '~/components/pages/projects/error';
import { useProject, useProjectStats, useProjectActivity } from '~/lib/queries/projects';
import { useWorkflows } from '~/lib/queries/workflows';
import { useEffect, useState } from 'react'
import { WorkflowSummary } from '~/components/pages/projects/workflow-summary';
import { projectQueryOptions } from '~/lib/queries/project';
import { workflowsQueryOptions } from '~/lib/queries/workflows';
import { projectApi } from "~/lib/api/projects"
import { Outlet } from "@tanstack/react-router"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~ui/select";
import { LineChart } from '~/components/ui/charts/line-chart';
import { WorkflowStatsCard } from "~/components/workflow/workflow-stats-card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~ui/breadcrumb';
import { Link } from '@tanstack/react-router';
import type { Workflow } from "~types";


const defaultProjectStats = {
	current: {
		totalWorkflows: 0,
		totalTriggeredToday: 0,
		activeWorkflows: 0,
		totalEventsToday: 0,
		totalEvents: 0,
	},
	comparisons: {
		thirtyMin: {
			triggeredDiff: 0,
			activeDiff: 0,
			eventsDiff: 0,
		},
		oneHour: {
			triggeredDiff: 0,
			activeDiff: 0,
			eventsDiff: 0,
		}
	}
};

export const Route = createFileRoute('/_auth/projects/$projectId')({
	loader: async ({ context: { queryClient }, params: { projectId } }) => {
		// Prefetch project data
		await queryClient.ensureQueryData(projectQueryOptions(projectId));

		// Prefetch workflows
		await queryClient.ensureQueryData(workflowsQueryOptions(projectId));

		// Prefetch stats
		await queryClient.ensureQueryData({
			queryKey: ['projectStats', projectId],
			queryFn: () => projectApi.getStats(projectId),
		});

		// Prefetch activity
		await queryClient.ensureQueryData({
			queryKey: ['projectActivity', projectId],
			queryFn: () => projectApi.getActivity(projectId),
		});
	},
	errorComponent: ({ error }) => <ProjectDetailError error={error as Error} />,
	pendingComponent: () => <ProjectDetailSkeleton />,
	component: ProjectDetailPage,
});

function ProjectDetailPage() {
	const { projectId } = Route.useParams();
	const matches = useMatches();


	const isProjectsRoot = matches[matches.length - 1].routeId === '/_auth/projects/$projectId';

	const {
		data: project,
		isLoading: projectLoading,
		error: projectError
	} = useProject(projectId);

	const { data: stats } = useProjectStats(projectId);
	const { data: activity } = useProjectActivity(projectId);

	const {
		data: workflows,
		isLoading: workflowsLoading,
		error: workflowsError
	} = useWorkflows(projectId);

	const chartData = activity?.map(item => ({
		name: new Date(item.timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			hour12: true
		}),
		workflows: item.workflowCount
	})) || [];

	useEffect(() => {
		if (workflowsError) {
			console.error('Workflows fetch error:', workflowsError);
		}
	}, [workflowsError]);

	useEffect(() => {

	}, [projectId, project, workflows, workflowsLoading, workflowsError]);

	const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

	const transformedActivity = activity?.map(item => ({
		timestamp: item.timestamp,
		eventCount: item.workflowCount
	})) ?? [];

	const copyToClipboard = async (text: string, label: string) => {
		await navigator.clipboard.writeText(text);
		notify.success(`${label} copied to clipboard`);
	};

	if (projectLoading) return <ProjectDetailSkeleton />;
	if (projectError) return <ProjectDetailError error={projectError as Error} />;
	if (!project) return null;

	return (
		<div className="container py-6 space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link to="/projects">Projects</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink>
							{project.name}
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{isProjectsRoot ? (
				<>
					<Card>
						<CardHeader>
							<div className="flex justify-between items-center">
								<div>
									<CardTitle>{project.name}</CardTitle>
									<p className="text-sm text-muted-foreground mt-1">
										{project.description || "No description provided"}
									</p>
								</div>

							</div>
						</CardHeader>
					</Card>

					{/* Workflow Summary */}
					<div className="flex flex-wrap gap-6">
						<WorkflowSummary
							workflows={workflows ?? []}
							stats={stats ?? defaultProjectStats}
						/>
					</div>

					{/* Update the grid layout to be full width */}
					<div className="space-y-6">
						{/* Activity Chart Card - Now full width */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Workflow Activity</CardTitle>
								<Select
									value={chartType}
									onValueChange={(value) => setChartType(value as 'bar' | 'line')}
								>
									<SelectTrigger className="w-32">
										<SelectValue placeholder="Chart Type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="bar">Bar Chart</SelectItem>
										<SelectItem value="line">Line Chart</SelectItem>
									</SelectContent>
								</Select>
							</CardHeader>
							<CardContent>
								<ChartContainer className="h-[400px]" config={{
									workflows: {
										label: 'Workflows',
										theme: {
											light: 'hsl(var(--primary) / 0.7)',
											dark: 'hsl(var(--primary) / 0.7)',
										},
									},
								}}>
									{chartType === 'bar' ? (
										<BarChart data={chartData}>
											<XAxis dataKey="name" />
											<YAxis />
											<Bar
												dataKey="workflows"
												fill="var(--color-workflows)"
												radius={[4, 4, 0, 0]}
												opacity={0.7}
											/>
											<ChartTooltip />
										</BarChart>
									) : (
										<LineChart
											data={transformedActivity}
											showAxes
											showTooltip
											height={400}
										/>
									)}
								</ChartContainer>
							</CardContent>
						</Card>

						{/* Project Information Card - Now full width */}
						<Card>
							<CardHeader>
								<CardTitle>Project Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="text-sm text-muted-foreground">Project ID</div>
									<div className="flex items-center gap-2">
										<code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
											{project.id}
										</code>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => copyToClipboard(project.id, 'Project ID')}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div className="space-y-2">
									<div className="text-sm text-muted-foreground">API Key</div>
									<div className="flex items-center gap-2">
										<code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
											{project.apiKey.slice(0, 5)}****{project.apiKey.slice(-4)}
										</code>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => copyToClipboard(project.apiKey, 'API Key')}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div className="space-y-2">
									<div className="text-sm text-muted-foreground">Project URL</div>
									{project.projectUrl ? (
										<a
											href={project.projectUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline flex items-center gap-2"
										>
											<ExternalLink className="h-4 w-4" />
											{project.projectUrl}
										</a>
									) : (
										<p className="text-muted-foreground">Not specified</p>
									)}
								</div>
								<div className="space-y-2">
									<div className="text-sm text-muted-foreground">GitHub Repository</div>
									{project.githubUrl ? (
										<a
											href={project.githubUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:underline flex items-center gap-2"
										>
											<Github className="h-4 w-4" />
											{project.githubUrl}
										</a>
									) : (
										<p className="text-muted-foreground">Not specified</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Workflow Stats Cards - Grid layout */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{workflows?.map((workflow: Workflow) => (
								<WorkflowStatsCard
									key={workflow.id}
									name={workflow.name}
									eventsToday={workflow.eventsToday}
									trend={workflow.trend}
									comparisons={{
										oneHour: {
											eventsDiff: workflow.comparisons?.oneHour?.eventsDiff ?? 0
										}
									}}
								/>
							))}
						</div>
					</div>

					{/* Workflows Table */}
					<Card>
						<CardHeader>
							<CardTitle>Workflows</CardTitle>
						</CardHeader>
						<CardContent>
							<WorkflowsTable
								data={workflows ?? []}
								isLoading={workflowsLoading}
							/>
						</CardContent>
					</Card>
				</>
			) : null}

			<Outlet />
		</div>
	);
}
