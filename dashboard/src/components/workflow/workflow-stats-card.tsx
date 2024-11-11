import { Card } from "~ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { cx } from "~utils";

interface WorkflowStatsCardProps {
	name: string;
	eventsToday: number;
	trend: Array<{ timestamp: string; eventCount: number }>;
	comparisons?: {
		oneHour?: {
			eventsDiff: number;
		};
	};
}

const trendColors = {
	positive: {
		text: "text-emerald-600 dark:text-emerald-400",
		bg: "bg-emerald-50/50 dark:bg-emerald-950/50",
	},
	negative: {
		text: "text-rose-600 dark:text-rose-400",
		bg: "bg-rose-50/50 dark:bg-rose-950/50",
	}
};

export function WorkflowStatsCard({ name, eventsToday, trend, comparisons = {} }: WorkflowStatsCardProps) {
	const eventsDiff = comparisons?.oneHour?.eventsDiff ?? 0;
	const percentageChange = eventsToday > 0
		? `${eventsDiff > 0 ? '+' : ''}${((eventsDiff / eventsToday) * 100).toFixed(2)}%`
		: '0%';

	const trendType = eventsDiff >= 0 ? 'positive' : 'negative';

	return (
		<Card className="relative overflow-hidden bg-background/95 p-4">
			<div className="absolute left-0 top-0 h-full w-[3px] bg-primary/40" />

			<div className="space-y-2">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="font-medium text-sm text-muted-foreground">
							{name} [Total Events]
						</h3>
						<p className="text-2xl font-bold">
							{eventsToday.toLocaleString()} events
						</p>
					</div>

					<div className={cx(
						"text-sm font-medium px-2 py-1 rounded-full",
						trendColors[trendType].text,
						trendColors[trendType].bg,
					)}>
						{percentageChange} from previous hour
					</div>
				</div>

				<div className="h-[60px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={trend}>
							<Line
								type="monotone"
								dataKey="eventCount"
								stroke="hsl(var(--primary))"
								strokeWidth={1.5}
								dot={false}
								strokeOpacity={0.7}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</Card>
	);
} 