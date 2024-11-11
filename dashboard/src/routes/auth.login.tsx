import { createFileRoute, redirect } from '@tanstack/react-router';
import { Fragment } from 'react/jsx-runtime';
import { z } from 'zod';
import { useAuth } from '~auth';
import { createLoginForm } from '~components/form/login-form';

const fallbackRedirectPath = "/";
export const Route = createFileRoute('/auth/login')({
	validateSearch: z.object({
		redirect: z.string().optional().catch('/'),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ to: search.redirect || fallbackRedirectPath });
		}
	},
	component: LoginPage
});


function LoginPage() {
	const auth = useAuth();
	const search = Route.useSearch();
	// const navigate = Route.useNavigate();

	const { Form: LoginForm } = createLoginForm({
		auth,
		/*navigate,*/
		redirectPath: search.redirect! || fallbackRedirectPath
	});


	return (
		<div className='flex justify-center items-center px-4 py-12 min-h-screen bg-gray-50 sm:px-6 lg:px-8'>
			<div className='space-y-8 w-full max-w-sm'>
				<div>
					<h2 className='mt-6 text-3xl font-bold tracking-tight text-center text-gray-900'>
						Sign in to your account
					</h2>
					<p className='mt-2 text-sm text-center text-gray-600'>
						Or{' '}
						<a href='/auth/signup' className='font-medium text-indigo-600 hover:text-indigo-500'>
							create a new account
						</a>
					</p>
				</div>
				<Fragment>
					<LoginForm />
				</Fragment>
				<p className='text-xs text-center text-gray-500'>
					By clicking "Create account", you agree to our{' '}
					<a href='#' className='underline'>
						Terms of Service
					</a>{' '}
					and{' '}
					<a href='#' className='underline'>
						Privacy Policy
					</a>
					.
				</p>
			</div>
		</div>
	);
}
