import { Card } from "~ui/card";
import { Input } from "~ui/input";
import { Tabs, TabsList, TabsTrigger } from "~ui/tabs";
import { LineChart } from "~ui/charts/line-chart";
import { Badge } from "~ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { workflowApi } from "~/lib/api/workflows";
import type { Workflow } from "~types";

export function WorkflowList({ workflowName }: { workflowName: string }) {
	const { data: workflows } = useQuery({
		queryKey: ['workflows'],
		queryFn: () => workflowApi.list(workflowName),
	});

	const [filter, setFilter] = useState("");
	const [activeTab, setActiveTab] = useState("all");

	const filteredWorkflows = workflows?.filter((w: Workflow) => {
		const matchesFilter = w.name.toLowerCase().includes(filter.toLowerCase());
		if (activeTab === "all") return matchesFilter;
		if (activeTab === "active") return matchesFilter && w.status === "active";
		if (activeTab === "inactive") return matchesFilter && w.status === "inactive";
		return matchesFilter;
	});

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<Input
					placeholder="Search workflows..."
					className="max-w-sm"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="active">Active</TabsTrigger>
						<TabsTrigger value="inactive">Inactive</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="grid gap-4">
				{filteredWorkflows?.map((workflow: Workflow) => (
					<Card key={workflow.id} className="p-4">
						<div className="flex items-start justify-between">
							<div>
								<div className="flex items-center gap-2">
									<Badge 
										variant={workflow.status === 'active' ? 'success' : 'default'}
										className="rounded-full"
									>
										{workflow.status}
									</Badge>
									<h3 className="text-lg font-semibold">{workflow.name}</h3>
								</div>
								<div className="text-sm text-muted-foreground mt-1">
									Last event: {workflow.lastEventAt
										? formatDistanceToNow(new Date(workflow.lastEventAt), { addSuffix: true })
										: 'Never'}
								</div>
								<div className="text-sm mt-1">
									{workflow.eventsToday} events today
								</div>
							</div>
							<div className="w-[200px] h-[50px]">
								<LineChart
									data={workflow.trend}
									showAxes={false}
									height="100%"
								/>
							</div>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
} 