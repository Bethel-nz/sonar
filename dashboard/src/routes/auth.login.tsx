import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { useAuth } from '~auth'
import { createForm } from '~/components/create-form'
import { measureRender } from '~/utils/measure-render-time'
import { cx } from '~utils'
import { CustomAuthForm, CustomAuthInput } from '~/components/custom/auth-form-inputs'
import { notify } from "~ui/sonner"
import { withRetry } from '~/utils/retry'

export const Route = createFileRoute('/auth/login')({
	validateSearch: z.object({
		redirect: z.string().optional().catch('/'),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ to: search.redirect })
		}
	},
	component: measureRender(LoginPage, (time) => {
		console.log(`LoginPage rendered in ${time}ms`);
	}),
})


/**
 * Login page
 * this component doesnt too much
 * 
 * Note to self: streamline and code split it same with ./src/routes/auth.signup.tsx
 * 
*/
function LoginPage() {
	const auth = useAuth()
	const search = Route.useSearch()
	const navigate = Route.useNavigate()

	const loginSchema = z.object({
		email: z
			.string()
			.email('Invalid email address')
			.label('Email address')
			.placeholder('Email address'),
		password: z
			.string()
			.min(6, 'Password must be at least 6 characters')
			.label('Password')
			.password()
			.placeholder('Password'),
	})

	const { Form: LoginForm, methods: formMethods } = createForm([{
		schema: loginSchema,
		submit: {
			text: 'Sign in',
			width: 'full',
			className: cx(
				'mt-6 flex w-full justify-center rounded-md px-3 py-2',
				'bg-indigo-600 text-sm font-semibold text-white',
				'hover:bg-indigo-500',
				'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			),
		}
	}], {
		className: 'mt-8 space-y-6',
		components: {
			Form: CustomAuthForm,
			Input: CustomAuthInput,
		},
		defaultValues: {
			email: '',
			password: ''
		},
		props: {
			className: "space-y-0"
		},
		action: {
			onSubmit: async (values) => {
				try {
					await withRetry(
						() => auth.login(values.email, values.password),
						{
							onAttempt: (attempt) => {
								if (attempt > 1) {
									notify.default(`Retry attempt ${attempt}/3`);
								}
							},
							onMaxAttemptsReached: () => {
								notify.error(
									"Failed to sign in",
									"Maximum retry attempts reached. Please try again later."
								);
							},
							onError: (error, attempt) => {
								console.error(error);
								if (attempt < 3) {
									notify.withAction(
										"Failed to sign in",
										"Retry",
										() => {
											formMethods.reset({
												email: values.email,
												password: ''
											});
										}
									);
								}
							},
							onSuccess: () => {
								notify.success("Signed in successfully!");
								navigate({ to: search.redirect });
							},
							resetAction: () => {
								formMethods.reset({
									...values,
									password: ''
								});
							}
						}
					);
				} catch (err) {
					console.error('Login error:', err);
					notify.error('Failed to sign in', 'Please try again later.')
				}
			},
			onError: (error) => {
				console.error('Form error:', error);
				notify.error("An Error Occurred", "Please try again later.")
			},
		},
	})

	return (
		<div className="flex justify-center items-center px-4 py-12 min-h-screen bg-gray-50 sm:px-6 lg:px-8">
			<div className="space-y-8 w-full max-w-sm">
				<div>
					<h2 className="mt-6 text-3xl font-bold tracking-tight text-center text-gray-900">
						Sign in to your account
					</h2>
					<p className="mt-2 text-sm text-center text-gray-600">
						Or{' '}
						<a
							href="/auth/signup"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							create a new account
						</a>
					</p>
				</div>

				<LoginForm />
			</div>
		</div>
	)
}