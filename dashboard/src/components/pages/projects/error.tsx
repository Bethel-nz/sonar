import { useRouter } from '@tanstack/react-router';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Button } from '~ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '~ui/alert';
import { Link } from '@tanstack/react-router';

export function ProjectsErrorComponent({ error }: ErrorComponentProps) {
	const router = useRouter();
	const queryErrorResetBoundary = useQueryErrorResetBoundary();

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
			<div className="text-center space-y-4">
				<h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
				<p className="text-gray-600">{error.message}</p>
				<Button
					onClick={() => {
						queryErrorResetBoundary.reset();
						router.invalidate();
					}}
					className="inline-flex items-center gap-2"
				>
					<ReloadIcon className="h-4 w-4" />
					Try again
				</Button>
			</div>
		</div>
	);
}

export function ProjectDetailError({ error }: { error: Error }) {
	return (
		<div className="container py-6">
			<Alert variant="destructive">
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Error</AlertTitle>
				<AlertDescription className="space-y-4">
					<p>{error.message}</p>
					<Button asChild variant="outline">
						<Link to="/projects">Back to Projects</Link>
					</Button>
				</AlertDescription>
			</Alert>
		</div>
	);
} 