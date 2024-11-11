import { signupSchema } from './schema/signup-form.schema';
import { cx } from '~utils';
import {
	CustomAuthInput,
	CustomAuthPasswordInput,
} from '~/components/custom/auth-form-inputs';
import { notify } from '~ui/sonner';
import { useAuth } from '~auth';
import { Loader2 } from 'lucide-react';
import { createForm } from '~components/form-builder';
import type { FormState } from '~components/form-builder';
import { useRouter } from '@tanstack/react-router';

interface SignupFormData {
	email: string;
	username: string;
	password: string;
	confirmPassword: string;
}

const validatePasswords = (data: SignupFormData): data is SignupFormData => {
	if (data.password !== data.confirmPassword) {
		notify.error("Passwords don't match", 'Please make sure your passwords match');
		return false;
	}
	return true;
};

interface SignupFormProps {
	auth: ReturnType<typeof useAuth>;
	redirectPath: string | undefined;
}

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
		{formState.isSubmitting ? 'Signing up...' : 'Sign up'}
	</button>
);

export function createSignupForm({ auth, redirectPath }: SignupFormProps) {
	const router = useRouter();

	const { Form, methods } = createForm(
		[{ schema: signupSchema }],
		{
			className: 'mt-6 space-y-3',
			submit: {
				component: SubmitButton,
			},
			layout: {
				type: 'form',
				components: {
					email: {
						containerClassName: '',
						className: 'placeholder:text-gray-800 bg-gray-200 rounded-md',
						
					},
					username: {
						containerClassName: '',
						className: 'placeholder:text-gray-800 bg-gray-200 rounded-md',
						
					},
					password: {
						containerClassName: '',
						className: 'placeholder:text-gray-800 bg-gray-200 rounded-md',
						
					},
					confirmPassword: {
						className: 'placeholder:text-gray-800 bg-gray-200 rounded-md',
						
					},
				},
			},
			defaultValues: {
				email: '',
				username: '',
				password: '',
				confirmPassword: '',
			},
			props: {
				className: 'space-y-3',
			},
			action: {
				onSubmit: async (values) => {
					try {
						const result = signupSchema.safeParse(values);
						if (!result.success) {
							const errors = result.error.errors;
							const errorMessage = errors[0]?.message || 'Invalid form data';
							throw new Error(errorMessage);
						}

						if (!validatePasswords(values)) {
							throw new Error("Passwords don't match");
						}

						await auth.signup({
							email: values.email,
							username: values.username,
							password: values.password,
						});
						notify.success('Account created successfully!');
					} catch (error: any) {
						console.error('Signup error:', error);
						notify.error(
							'Failed to create account',
							error.message || 'Please check your information and try again',
						);
						methods.reset({
							email: values.email,
							username: values.username,
							password: '',
							confirmPassword: '',
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

	return { Form, methods } as const;
}
