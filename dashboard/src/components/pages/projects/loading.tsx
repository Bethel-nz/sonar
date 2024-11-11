import { Card, CardHeader, CardContent } from '~ui/card';
import { Skeleton } from '~ui/skeleton';

export function ProjectCardSkeleton() {
	return (
		<Card className="p-6 space-y-4">
			<div className="space-y-3">
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-4 w-1/4" />
			</div>
			<div className="space-y-3">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-2/3" />
			</div>
			<Skeleton className="h-9 w-full mt-4" />
		</Card>
	);
}

export function ProjectsGrid() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{[1, 2, 3].map((i) => (
				<ProjectCardSkeleton key={i} />
			))}
		</div>
	);
}

export function ProjectDetailSkeleton() {
	return (
		<div className="container py-6 space-y-6">
			<div className="flex justify-between items-center">
				<Skeleton className="h-10 w-[200px]" />
				<Skeleton className="h-10 w-[100px]" />
			</div>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-[150px]" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex justify-between items-center">
								<Skeleton className="h-4 w-[100px]" />
								<Skeleton className="h-4 w-[150px]" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 