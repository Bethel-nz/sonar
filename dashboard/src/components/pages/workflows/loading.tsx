import { Card, CardContent, CardHeader, CardTitle } from "~ui/card";
import { Skeleton } from "~ui/skeleton";

export function WorkflowDetailSkeleton() {
	return (
		<div className="container py-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>
						<Skeleton className="h-8 w-[200px]" />
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-[100px]" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-[150px]" />
						<div className="grid gap-4 md:grid-cols-3">
							<Skeleton className="h-24 w-full" />
							<Skeleton className="h-24 w-full" />
							<Skeleton className="h-24 w-full" />
						</div>
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-[120px]" />
						<div className="space-y-2">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default WorkflowDetailSkeleton;
