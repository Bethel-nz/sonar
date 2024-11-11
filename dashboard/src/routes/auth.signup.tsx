import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { useAuth } from '~auth';
import { createSignupForm } from '~components/form/sign-up-form';
import { Fragment } from 'react/jsx-runtime';

const fallbackRedirectPath = '/';
export const Route = createFileRoute('/auth/signup')({
	validateSearch: z.object({
		redirect: z.string().optional().catch('/'),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ to: search.redirect! || fallbackRedirectPath });
		}
	},
	component: SignupPage,
});

function SignupPage() {
	const auth = useAuth();
	const search = Route.useSearch();
	// const navigate = Route.useNavigate();

	const { Form: SignupForm } = createSignupForm({
		auth,
		/* navigate,*/
		redirectPath: search.redirect! || fallbackRedirectPath,
	});

	return (
		<div className='flex justify-center items-center px-4 py-8 min-h-screen bg-gray-50 sm:px-6 lg:px-8'>
			<div className='space-y-6 w-full max-w-sm'>
				<div>
					<h2 className='mt-6 text-3xl font-bold tracking-tight text-center text-gray-900'>
						Create your account
					</h2>
					<p className='mt-2 text-sm text-center text-gray-600'>
						Already have an account?{' '}
						<a href='/auth/login' className='font-medium text-indigo-600 hover:text-indigo-500'>
							Sign in
						</a>
					</p>
				</div>
				<Fragment>
					<SignupForm />
				</Fragment>

				<p className='text-xs text-center text-gray-500'>
					By clicking "Create account", you agree to our{' '}
					<a href='/terms' className='underline'>
						Terms of Service
					</a>{' '}
					and{' '}
					<a href='/privacy' className='underline'>
						Privacy Policy
					</a>
					.
				</p>
			</div>
		</div>
	);
}
