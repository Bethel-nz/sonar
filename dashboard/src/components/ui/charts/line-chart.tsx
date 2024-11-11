import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { WorkflowTrend } from '~/types';

interface LineChartProps {
	data: WorkflowTrend[];
	color?: string;
	showAxes?: boolean;
	showTooltip?: boolean;
	height?: number | string;
}

export function LineChart({
	data = [],
	color = 'hsl( 262.1 83.3% 57.8%)',
	showAxes = false,
	showTooltip = true,
	height = '100%'
}: LineChartProps) {
	// Ensure data is properly formatted and sorted by timestamp
	const validData = data
		.filter((d): d is WorkflowTrend =>
			d !== undefined &&
			d !== null &&
			typeof d.timestamp === 'string' &&
			typeof d.eventCount === 'number'
		)
		.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

	if (!validData || validData.length === 0) {
		return null;
	}

	// Transform data for the chart
	const chartData = validData.map(d => ({
		timestamp: d.timestamp,
		value: d.eventCount
	}));

	return (
		<div style={{ height, width: '100%' }}>
			<ResponsiveContainer width="100%" height="100%">
				<RechartsLineChart
					data={chartData}
					margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
				>
					{showAxes && (
						<>
							<XAxis
								dataKey="timestamp"
								stroke="hsl(215.4 16.3% 46.9%)"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => {
									return new Date(value).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit'
									});
								}}
							/>
							<YAxis
								stroke="hsl(215.4 16.3% 46.9%)"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								width={30}
							/>
						</>
					)}
					{showTooltip && (
						<Tooltip
							cursor={{ stroke: 'hsl(215.4 16.3% 46.9%)', strokeWidth: 1 }}
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const data = payload[0].payload;
								return (
									<div className="rounded-lg border bg-background p-2 shadow-md">
										<div className="grid grid-cols-2 gap-2">
											<span className="text-sm font-medium">Time:</span>
											<span className="text-sm">
												{new Date(data.timestamp).toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit'
												})}
											</span>
											<span className="text-sm font-medium">Events:</span>
											<span className="text-sm">{data.value}</span>
										</div>
									</div>
								);
							}}
						/>
					)}
					<Line
						type="monotone"
						dataKey="value"
						stroke={color}
						strokeWidth={2}
						dot={false}
						activeDot={{
							r: 4,
							strokeWidth: 0,
							fill: color
						}}
						isAnimationActive={true}
					/>
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
	);
} 