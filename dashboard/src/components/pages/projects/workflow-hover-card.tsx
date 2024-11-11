import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "~ui/hover-card";
import { Button } from "~ui/button";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Activity, ArrowRight } from "lucide-react";
import type { Workflow } from "~/types";
import { LineChart } from '~/components/ui/charts/line-chart';

interface WorkflowHoverCardProps {
	workflow: Workflow;
}

export function WorkflowHoverCard({ workflow }: WorkflowHoverCardProps) {
	// Calculate total events from today's events and hourly average
	const totalEvents = workflow.eventsToday + Math.floor(workflow.hourlyAverage * 24);

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<div className="flex items-center gap-2">
					<span className="font-medium cursor-pointer hover:underline">
						{workflow.name}
					</span>
					<div className="w-24 h-8">
						<LineChart
							data={workflow.trend || []}
							color={workflow.status === 'active' ? 'var(--success)' : 'var(--muted)'}
						/>
					</div>
				</div>
			</HoverCardTrigger>
			<HoverCardContent className="w-96">
				<div className="space-y-4">
					<div className="flex justify-between space-x-4">
						<div className="space-y-1">
							<h4 className="text-sm font-semibold">{workflow.name}</h4>
							<p className="text-sm text-muted-foreground">
								{workflow.description || "No description provided"}
							</p>
							<div className="flex items-center pt-2">
								<CalendarDays className="mr-2 h-4 w-4 opacity-70" />
								<span className="text-xs text-muted-foreground">
									Created {new Date(workflow.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div className="flex items-center pt-2">
								<Activity className="mr-2 h-4 w-4 opacity-70" />
								<span className="text-xs text-muted-foreground">
									{totalEvents} total events • {workflow.eventsToday} today
								</span>
							</div>
						</div>
					</div>

					<div className="flex justify-end mt-4">
						<Link
							to="/projects/$projectId/workflows/$workflowName"
							params={{
								projectId: workflow.projectId,
								workflowName: workflow.name,
							}}
						>
							<Button variant="ghost" size="sm" className="gap-2">
								View Details
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
} 