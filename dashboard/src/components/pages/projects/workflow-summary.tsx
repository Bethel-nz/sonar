import { Card, CardContent, CardHeader, CardTitle } from "~ui/card";
import { ArrowUp, ArrowDown, Loader2, Zap, PlayCircle, BarChart3, Calculator } from "lucide-react";
import type { Workflow } from "~types";
import { Badge } from "~ui/badge";
import { useIsFetching } from "@tanstack/react-query";
import NumberFlow from '@number-flow/react';

function StatBadge({ value }: { value: number }) {
	if (value === 0) {
		return (
			<Badge
				variant="outline"
				className="ml-2 text-muted-foreground border-muted-foreground/20 group-hover:text-muted-foreground/80 dark:group-hover:text-muted-foreground"
			>
				No change
			</Badge>
		);
	}

	return (
		<Badge
			variant={value > 0 ? "success" : "error"}
			className="ml-2 border-muted-foreground/20 group-hover:text-muted-foreground/80 dark:group-hover:text-muted-foreground"
		>
			{value > 0 ? <ArrowUp className="w-3 h-3 mr-1 text-muted-foreground" /> : <ArrowDown className="w-3 h-3 mr-1 text-muted-foreground" />}
			{Math.abs(value)} in 30m
		</Badge>
	);
}

interface WorkflowSummaryProps {
	workflows: Workflow[];
	stats: {
		current: {
			totalWorkflows: number;
			totalTriggeredToday: number;
			activeWorkflows: number;
			totalEventsToday: number;
		};
		comparisons: {
			thirtyMin: {
				triggeredDiff: number;
				activeDiff: number;
				eventsDiff: number;
			};
			oneHour: {
				triggeredDiff: number;
				activeDiff: number;
				eventsDiff: number;
			};
		};
	};
}

export function WorkflowSummary({ workflows, stats }: WorkflowSummaryProps) {
	const isFetching = useIsFetching();
	const inactiveWorkflows = workflows.filter(w => w.status === 'inactive').length;
	const averageEventsPerWorkflow = workflows.length > 0
		? Math.round(workflows.reduce((sum, w) => sum + w.eventsToday, 0) / workflows.length)
		: 0;

	return (
		<>
			{isFetching > 0 && (
				<div className="fixed bottom-4 right-4">
					<div className="bg-primary text-primary-foreground px-3 py-2 rounded-md flex items-center gap-2">
						<Loader2 className="h-4 w-4 animate-spin" />
						<span className="text-sm">Refreshing...</span>
					</div>
				</div>
			)}
			<div className="flex flex-row gap-4 flex-wrap w-full">
				<div className="flex-1 min-w-[200px]">
					<Card className="workflow-summary-card h-full group">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Workflows Triggered</CardTitle>
							<Zap className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center">
								<div className="text-2xl font-bold">
									<NumberFlow
										value={stats.current.totalTriggeredToday}
										format={{ notation: 'standard' }}
										transformTiming={{ duration: 800, easing: 'ease-out' }}
										continuous
									/>
								</div>
								<StatBadge value={stats.comparisons.thirtyMin.triggeredDiff} />
							</div>
							<p className="text-xs text-muted-foreground">
								{stats.comparisons.oneHour.triggeredDiff > 0 ? '+' : ''}{stats.comparisons.oneHour.triggeredDiff} in last hour
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex-1 min-w-[200px]">
					<Card className="workflow-summary-card h-full group">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
							<PlayCircle className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center">
								<div className="text-2xl font-bold">
									{stats.current.activeWorkflows}
								</div>
								<StatBadge value={stats.comparisons.thirtyMin.activeDiff} />
							</div>
							<p className="text-xs text-muted-foreground">
								{inactiveWorkflows} inactive workflows
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex-1 min-w-[200px]">
					<Card className="workflow-summary-card h-full group">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Events</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center">
								<div className="text-2xl font-bold">
									<NumberFlow
										value={stats.current.totalEventsToday}
										format={{ notation: 'standard' }}
										transformTiming={{ duration: 800, easing: 'ease-out' }}
										continuous
									/>
								</div>
								<StatBadge value={stats.comparisons.thirtyMin.eventsDiff} />
							</div>
							<p className="text-xs text-muted-foreground">
								{stats.comparisons.oneHour.eventsDiff > 0 ? '+' : ''}{stats.comparisons.oneHour.eventsDiff} in last hour
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex-1 min-w-[200px]">
					<Card className="workflow-summary-card h-full group">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Average Events</CardTitle>
							<Calculator className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="flex items-center">
								<div className="text-2xl font-bold">{averageEventsPerWorkflow}</div>
							</div>
							<p className="text-xs text-muted-foreground">
								Per workflow today
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
} 