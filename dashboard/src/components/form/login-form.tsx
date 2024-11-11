import { createForm } from '~components/form-builder';
import { loginSchema } from '~components/form/schema/login-form.schema';
import {
	CustomAuthInput,
	CustomAuthPasswordInput,
} from '~/components/custom/auth-form-inputs';
import { notify } from '~ui/sonner';
import { cx } from '~utils';
import { useAuth } from '~auth';
import { Loader2 } from 'lucide-react';
import type { FormState } from '~components/form-builder';
import { useRouter } from '@tanstack/react-router';

interface SubmitButtonProps {
	formState: FormState;
}

const SubmitButton = ({ formState }: SubmitButtonProps) => (
	<button
		type='submit'
		disabled={formState.isSubmitting}
		className={cx(
			'mt-6 flex w-full items-center justify-center gap-2 rounded-md px-3 py-4',
			'bg-indigo-600 text-sm font-semibold text-white',
			'hover:bg-indigo-500',
			'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
			'disabled:opacity-50 disabled:cursor-not-allowed',
		)}
	>
		{formState.isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
		{formState.isSubmitting ? 'Signing in...' : 'Sign in'}
	</button>
);

export function createLoginForm({
	auth,
	redirectPath,
}: {
	auth: ReturnType<typeof useAuth>;
	redirectPath: string | undefined;
}) {
	const router = useRouter();

	const { Form, methods: formMethods } = createForm(
		[
			{
				schema: loginSchema,
			},
		],
		{
			className: 'mt-8 space-y-6',
			submit: {
				component: SubmitButton,
			},
			layout: {
				type: 'form',
				components: {
					email: {
						className: 'placeholder:text-gray-800 bg-gray-200 rounded-md',
						component: CustomAuthInput,
					},
					password: {
						className: 'placeholder:text-gray-800 bg-gray-200 rounded-md',
						component: CustomAuthPasswordInput,
					},
				},
			},
			defaultValues: {
				email: '',
				password: '',
			},
			props: {
				className: 'space-y-0',
			},
			action: {
				onSubmit: async (values) => {
					try {
						const result = loginSchema.safeParse(values);
						if (!result.success) {
							const errors = result.error.errors;
							const errorMessage = errors[0]?.message || 'Invalid form data';
							throw new Error(errorMessage);
						}

						await auth.login(values.email, values.password);
						notify.success('Signed in successfully!');
					} catch (error: any) {
						console.error('Login error:', error);
						notify.error(
							'Failed to sign in',
							error.message || 'Please check your credentials and try again',
						);
						formMethods.reset({ email: values.email, password: '' });

						notify.withAction('Want to try again?', 'Retry', async () => {
							formMethods.reset({ email: values.email, password: '' });
						});
						throw error;
					}
				},
				onError: (error) => {
					console.error('Form error:', error);
					notify.error('An Error Occurred', 'Please try again later.');
				},
				afterSubmit: async () => {
					await router.invalidate();
					window.location.href = redirectPath as string;
				},
			},
		},
	);

	return { Form, methods: formMethods } as const;
}
