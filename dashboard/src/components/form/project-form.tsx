import { createForm } from '~components/form-builder';
import { projectSchema } from './schema/project-form.schema';
import { notify } from '~ui/sonner';
import { cx } from '~utils';
import { Loader2 } from 'lucide-react';
import type { FormState } from '~components/form-builder';
import { useRouter } from '@tanstack/react-router';
import { projectApi } from '~/lib/api/projects';
import type { Project } from '~/types';
import type { ModalType } from '~/hooks/use-project-modal';
import { useQueryClient } from '@tanstack/react-query';

interface SubmitButtonProps {
	formState: FormState;
	type: ModalType;
}

const SubmitButton = ({ formState, type }: SubmitButtonProps) => {
	const buttonText = {
		create: { default: 'Create Project', loading: 'Creating...' },
		edit: { default: 'Save Changes', loading: 'Saving...' },
		delete: { default: 'Delete Project', loading: 'Deleting...' },
		update: { default: 'Update Project', loading: 'Updating...' },
	}[type];

	return (
		<button
			type='submit'
			disabled={formState.isSubmitting}
			className={cx(
				'inline-flex w-full justify-center rounded-none px-3 py-2',
				'text-sm font-semibold text-white shadow-sm',
				type === 'delete' ? 'bg-red-600 hover:bg-red-500' : 'bg-[#6D28D9] hover:bg-accent-2',
				'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
				'disabled:opacity-50 disabled:cursor-not-allowed',
			)}
		>
			{formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
			{formState.isSubmitting ? buttonText.loading : buttonText.default}
		</button>
	);
};

interface CreateProjectFormProps {
	type: ModalType;
	project?: Project | null;
	onSuccess: () => void;
}

export function createProjectForm({ type, project, onSuccess }: CreateProjectFormProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { Form, methods } = createForm(
		[{ schema: projectSchema }],
		{
			className: 'space-y-6',
			submit: {
				component: (props) => <SubmitButton {...props} type={type} />,
			},
			defaultValues: {
				name: project?.name || '',
				description: project?.description || '',
				'Project url': project?.projectUrl || '',
				'Github url': project?.githubUrl || '',
			},
			action: {
				onSubmit: async (values) => {
					try {
						switch (type) {
							case 'create':
								console.log(values)
								 await projectApi.create({
									name: values.name,
									description: values.description,
									projectUrl: values['Project url'],
									githubUrl: values['Github url'],
								});
								notify.success('Project created successfully');
								break;
							case 'edit':
								await projectApi.update(project!.id, {
									name: values.name,
									description: values.description,
									projectUrl: values['Project url'],
									githubUrl: values['Github url'],
								});
								notify.success('Project updated successfully');
								break;
							case 'delete':
								await projectApi.delete(project!.id);
								notify.success('Project deleted successfully');
								break;
						}
						await queryClient.invalidateQueries({ queryKey: ['projects'] });
						methods.reset();
					} catch (error) {
						const errorMessage = error instanceof Error
							? error.message
							: 'An unexpected error occurred';

						notify.error(`Failed to ${type} project`, errorMessage);
						throw error;
					}
				},
				onError: (error) => {
					const errorMessage = error instanceof Error
						? error.message
						: 'An unexpected error occurred';

					notify.error('An Error Occurred', errorMessage);
				},
				afterSubmit: async () => {
					router.invalidate();
					onSuccess();
				},
			},
			layout: {
				type: 'form',
				components: {
					description: {
						props: {
							rows: 4
						}
					}
				}
			}
		}
	);

	return { Form, methods } as const;
} 