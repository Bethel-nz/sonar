import { useState } from 'react';
import { MoreHorizontal, Trash, Activity, Copy } from 'lucide-react';
import { Button } from '~ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '~ui/dropdown-menu';
import type { Workflow } from '~/types';
import { notify } from '~ui/sonner';
import { Link, useNavigate } from '@tanstack/react-router';

interface CellActionProps {
	data: Workflow;
	onDelete?: (id: string) => Promise<void>;
}

export function WorkflowCellAction({ data, onDelete }: CellActionProps) {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const copyWorkflowId = async () => {
		try {
			await navigator.clipboard.writeText(data.id);
			notify.success('Workflow ID copied to clipboard');
		} catch {
			notify.error('Failed to copy workflow ID');
		}
	};

	const handleDelete = async () => {
		try {
			setLoading(true);
			await onDelete?.(data.id);
			notify.success('Workflow deleted successfully');
		} catch (error) {
			notify.error('Failed to delete workflow');
		} finally {
			setLoading(false);
		}
	};

	const handleViewEvents = () => {
		console.log('Navigating to workflow:', {
			projectId: data.projectId,
			workflowName: data.name,
			fullPath: `/projects/${data.projectId}/${data.name}`
		});

		// Try both navigation methods
		try {
			navigate({
				to: '/projects/$projectId/workflows/$workflowName',
				params: {
					projectId: data.projectId,
					workflowName: data.name
				}
			});
		} catch (error) {
			console.error('Navigation error:', error);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuItem onClick={copyWorkflowId}>
					<Copy className="mr-2 h-4 w-4" /> Copy ID
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleViewEvents} className="cursor-pointer">
					<Activity className="mr-2 h-4 w-4" /> View Events
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleDelete}
					className="text-red-600"
					disabled={loading}
				>
					<Trash className="mr-2 h-4 w-4" /> Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
} 