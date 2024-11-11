import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '~/components/ui/dialog';
import { useProjectModal } from '~/hooks/use-project-modal';
import { createProjectForm } from '~/components/form/project-form';
import { Button } from '~/components/ui/button';
import { projectApi } from '~/lib/api/projects';
import { notify } from '~ui/sonner';
import { useQueryClient } from '@tanstack/react-query';

export function ProjectModal() {
	const { isOpen, closeModal, type, project } = useProjectModal();
	const queryClient = useQueryClient();

	const { Form } = createProjectForm({
		type: type || 'create',
		project,
		onSuccess: closeModal
	});

	if (!isOpen || !type) return null;

	const handleDelete = async () => {
		try {
			await projectApi.delete(project!.id);
			await queryClient.invalidateQueries({ queryKey: ['projects'] });
			notify.success('Project deleted successfully');
			closeModal();
		} catch (error: any) {
			const errorMessage = error.response?.data?.error || error.message;
			notify.error('Failed to delete project', errorMessage);
		}
	};

	const titles = {
		create: 'Create New Project',
		edit: 'Edit Project',
		delete: 'Delete Project',
	};

	const descriptions = {
		create: 'Create a name for your project.',
		edit: 'Edit your project name.',
		delete: `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
	};

	return (
		<Dialog open={isOpen} onOpenChange={closeModal}>
			<DialogContent
				className='sm:max-w-lg gap-0'
				onPointerDownOutside={(e) => e.preventDefault()}
				onFocusOutside={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle className='text-lg font-medium leading-6 text-gray-900'>
						{titles[type]}
					</DialogTitle>
				</DialogHeader>

				<DialogClose />

				<div>
					<DialogDescription className="mb-4 text-sm text-gray-500">
						{descriptions[type]}
					</DialogDescription>

					{type === 'delete' ? (
						<div className="flex justify-end gap-3 mt-6">
							<Button
								variant="outline"
								onClick={closeModal}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={handleDelete}
							>
								Delete Project
							</Button>
						</div>
					) : (
						<Form />
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
} 