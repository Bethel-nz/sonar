import { Card, CardContent, CardHeader, CardTitle } from "~ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "~ui/button";
import { useNavigate } from "@tanstack/react-router";

interface WorkflowDetailErrorProps {
	error: Error;
}

export function WorkflowDetailError({ error }: WorkflowDetailErrorProps) {
	const navigate = useNavigate();

	return (
		<div className="container py-6">
			<Card className="border-destructive">
				<CardHeader>
					<CardTitle className="text-destructive flex items-center gap-2">
						<AlertCircle className="h-5 w-5" />
						Error Loading Workflow
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">{error.message}</p>
					<div className="flex gap-4">
						<Button onClick={() => window.location.reload()}>
							Try Again
						</Button>
						<Button variant="outline" onClick={() => navigate({ to: '/projects' })}>
							Back to Projects
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default WorkflowDetailError;
