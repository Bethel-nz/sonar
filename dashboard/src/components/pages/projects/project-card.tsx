import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '~ui/card';
import { Button } from '~ui/button';
import { Badge } from '~ui/badge';
import {
	ClipboardIcon,
	CounterClockwiseClockIcon,
} from '@radix-ui/react-icons';
import type { Project } from '~/types';
import { ProjectActions } from '~components/layout/projects/project-actions';
import { notify } from '~ui/sonner';

export function ProjectCard({ project }: { project: Project }) {
	const copyToClipboard = async (text: string, type: 'API Key' | 'Project ID') => {
		try {
			await navigator.clipboard.writeText(text);
			notify.success(`${type} copied to clipboard`);
		} catch (err) {
			notify.error(`Failed to copy ${type}`);
		}
	};

	return (
		<Card className="group hover:shadow-lg transition-all duration-300 w-80">
			<CardHeader>
				<div className="flex justify-between items-start">
					<div className="space-y-2">
						<CardTitle className="text-xl">{project.name}</CardTitle>
						<Badge variant="secondary" className="text-xs">
							Created {new Date(project.createdAt!).toLocaleDateString()}
						</Badge>
					</div>
					<ProjectActions project={project} />
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="space-y-3">
					{/* Project ID */}
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground flex items-center gap-2">
							Project ID
						</span>
						<div className="flex items-center gap-2">
							<code className="text-sm font-mono bg-muted px-2 py-1 rounded">
								{project.id}
							</code>
							<Button
								variant="ghost"
								size="sm"
								className="p-0 h-auto hover:bg-transparent"
								onClick={() => copyToClipboard(project.id, 'Project ID')}
							>
								<ClipboardIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
							</Button>
						</div>
					</div>

					{/* API Key */}
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground flex items-center gap-2">
							API Key
						</span>
						<div className="flex items-center gap-2">
							<code className="text-sm font-mono bg-muted px-2 py-1 rounded">
								{project.apiKey.slice(0, 4)}****{project.apiKey.slice(-4)}
							</code>
							<Button
								variant="ghost"
								size="sm"
								className="p-0 h-auto hover:bg-transparent"
								onClick={() => copyToClipboard(project.apiKey, 'API Key')}
							>
								<ClipboardIcon className="h-4 w-4 text-muted-foreground hover:text-primary" />
							</Button>
						</div>
					</div>

					{/* Last Updated */}
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground flex items-center gap-2">
							<CounterClockwiseClockIcon className="h-4 w-4" />
							Last Updated
						</span>
						<Badge variant="outline" className="text-xs">
							{new Date(project.updatedAt!).toLocaleDateString()}
						</Badge>
					</div>
				</div>
			</CardContent>

			<CardFooter>
				<Button
					variant="outline"
					className="w-full"
					asChild
				>
					<Link
						to='/projects/$projectId'
						params={{ projectId: project.id }}
					>
						View Details
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
