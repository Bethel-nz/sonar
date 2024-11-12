import { createFileRoute } from '@tanstack/react-router'
import { useWorkflow } from '~/lib/queries/workflows'
import { Card, CardContent, CardHeader, CardTitle } from '~ui/card'
import { WorkflowDetailSkeleton } from '~/components/pages/workflows/loading'
import { WorkflowDetailError } from '~/components/pages/workflows/error'
import { workflowApi } from '~/lib/api/workflows'
import { Badge } from "~ui/badge";
import { Button } from "~ui/button";
import { formatDistanceToNow } from "date-fns";
import { useProject } from '~/lib/queries/projects'
import { useWorkflowEvents } from '~/lib/queries/workflows'
import { useState } from 'react'
import { DataTable } from "~/components/ui/data-table/data-table";
import type { Event } from "~types";
import { EventSideDrawer } from '~components/ui/drawer/side-drawer'

export const Route = createFileRoute(
	'/_auth/projects/$projectId/workflows/$workflowName',
)({
	beforeLoad: ({ params }) => {
		console.log('Checking params:', params)
		if (!params.workflowName || params.workflowName.trim() === '') {
			throw new Error(`Workflow name parameter is missing ${params.workflowName}`)
		}
	},
	loader: async ({ context: { queryClient }, params }) => {
		const { projectId, workflowName } = params


		return queryClient.ensureQueryData({
			queryKey: ['workflow', projectId, workflowName],
			queryFn: () => workflowApi.get(projectId, workflowName),
		})
	},
	errorComponent: ({ error }) => <WorkflowDetailError error={error as Error} />,
	pendingComponent: () => <WorkflowDetailSkeleton />,
	component: WorkflowDetailPage,
})

function WorkflowDetailPage() {
	const { projectId, workflowName } = Route.useParams()
	const { data: workflow } = useWorkflow(projectId, workflowName)
	const { data: project } = useProject(projectId)
	const { data: events } = useWorkflowEvents(projectId, workflowName)
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 20,
	})

	const columns = [
		{
			id: "name",
			header: "Event Name",
			cell: (row: Event) => row.name
		},
		{
			id: "severity",
			header: "Severity",
			cell: (row: Event) => (
				<Badge variant={row.config.severity}>
					{row.config.severity}
				</Badge>
			)
		},
		{
			id: "description",
			header: "Description",
			cell: (row: Event) => row.config.description
		},
		{
			id: "time",
			header: "Time",
			cell: (row: Event) => {
				if (!row.createdAt) return "Never";
				return formatDistanceToNow(new Date(row.createdAt), { addSuffix: true });
			}
		},
		{
			id: "actions",
			header: "Actions",
			cell: (row: Event) => (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setSelectedEvent(row)}
				>
					View Details
				</Button>
			)
		}
	];

	if (!workflow || !project) return null

	// Calculate pagination
	const start = pagination.pageIndex * pagination.pageSize
	const end = start + pagination.pageSize
	const totalPages = Math.ceil((events?.length || 0) / pagination.pageSize)
	const paginatedEvents = events?.slice(start, end) ?? []

	return (
		<div className="container py-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{workflow.name}</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={paginatedEvents}
						filterFields={[
							{
								id: "name",
								label: "Event Name",
								type: "text",
							},
							{
								id: "config.severity",
								label: "Severity",
								type: "select",
								options: [
									{ label: "Info", value: "info" },
									{ label: "Warn", value: "warn" },
									{ label: "Error", value: "error" },
									{ label: "Critical", value: "critical" },
								],
							},
						]}
						pagination={{
							pageIndex: pagination.pageIndex,
							pageSize: pagination.pageSize,
							pageCount: totalPages,
							onPageChange: (newPageIndex) =>
								setPagination(prev => ({ ...prev, pageIndex: newPageIndex })),
							onPageSizeChange: (newPageSize) =>
								setPagination({ pageIndex: 0, pageSize: newPageSize }),
						}}
					/>
				</CardContent>
			</Card>

			<EventSideDrawer
				isOpen={!!selectedEvent}
				onOpenChange={(open: boolean) => !open && setSelectedEvent(null)}
				event={selectedEvent}
			/>
		</div>
	)
}
