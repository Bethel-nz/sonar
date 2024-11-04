import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { useAuth } from '~auth'
import { createForm } from '~/components/create-form'
import { measureRender } from '~/utils/measure-render-time'
import { cx } from '~utils'
import { CustomAuthForm, CustomAuthInput, CustomAuthPasswordInput } from '~/components/custom/auth-form-inputs'
import { notify } from "~ui/sonner"
import { withRetry } from '~/utils/retry'
import { TypeName } from '~/components/create-form';

// First define the enum for account types
const AccountType = z.enum(['personal', 'business']);
type AccountType = z.infer<typeof AccountType>;

export const Route = createFileRoute('/auth/signup')({
	validateSearch: z.object({
		redirect: z.string().optional().catch('/'),
	}),
	beforeLoad: ({ context, search }) => {
		if (context.auth.isAuthenticated) {
			throw redirect({ to: search.redirect })
		}
	},
	component: measureRender(SignupPage, (time) => {
		console.log(`SignupPage rendered in ${time}ms`);
	}),
})

function SignupPage() {
	const auth = useAuth()
	const search = Route.useSearch()
	const navigate = Route.useNavigate()

	const baseSchema = z.object({
		email: z
			.string()
			.min(1)
			.email('Invalid email address')
			.label('Email address')
			.placeholder('Email address'),
		username: z
			.string()
			.min(2, 'Username must be at least 2 characters')
			.label('Username')
			.placeholder('Username'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.label('Password')
			.password()
			.placeholder('Password'),
		confirmPassword: z
			.string()
			.min(1)
			.label('Confirm password')
			.password()
			.placeholder('Confirm password'),
		accountType: z
			.enum(['personal', 'business'])
			.select([
				{ label: 'Personal', value: 'personal' },
				{ label: 'Business', value: 'business' },
			])
			.label('Account Type')
			.default('personal'),
		terms: z
			.boolean().checkbox()
			.label(
				<span>
					I agree to the{' '}
					<a href="/terms" className="underline text-indigo-600 hover:text-indigo-500">
						terms and conditions
					</a>
				</span>
			)
			.refine((val) => val === true, {
				message: 'You must agree to the terms and conditions'
			})
			.default(false),
	});

	// Define the shape of the form data
	interface SignupFormData {
		email: string;
		username: string;
		password: string;
		confirmPassword: string;
		accountType: AccountType;
		terms: boolean;
	}

	// Type-safe validation function
	const validatePasswords = (data: SignupFormData): data is SignupFormData => {
		if (data.password !== data.confirmPassword) {
			notify.withAction(
				"Passwords don't match",
				"Retry",
				() => console.log("Retry")
			);
			return false;
		}
		return true;
	};

	const { Form: SignupForm, methods: formMethods } = createForm([{
		schema: baseSchema,
		submit: {
			text: 'Create account',
			width: 'full',
			className: cx(
				'mt-4 flex w-full justify-center rounded-md px-3 py-2',
				'bg-indigo-600 text-sm font-semibold text-white',
				'hover:bg-indigo-500',
				'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			),
		}
	}], {
		className: 'mt-6 space-y-3',
		components: {
			Form: CustomAuthForm,
			Input: CustomAuthInput,
		},
		layout: {
			type: "form",
			components: {
				email: {
					containerClassName: "",
					className: "placeholder:text-gray-800 bg-gray-200 rounded-md",

					typeName: TypeName.Input
				},
				username: {
					containerClassName: "",
					className: "placeholder:text-gray-800 bg-gray-200 rounded-md",
					component: CustomAuthInput,
					typeName: TypeName.Input
				},
				password: {
					containerClassName: "",
					className: "placeholder:text-gray-800 bg-gray-200 rounded-md",
					component: CustomAuthPasswordInput,
					typeName: TypeName.Password
				},
				confirmPassword: {
					className: "placeholder:text-gray-800 bg-gray-200 rounded-md",
					component: CustomAuthPasswordInput,
					typeName: TypeName.Password
				},
				accountType: {
					containerClassName: "",
					className: "placeholder:text-gray-800 bg-gray-200 rounded-md",
					typeName: TypeName.Select
				},
				terms: {
					containerClassName: "w-full mt-4",
					className: "h-4 w-4",
					typeName: TypeName.Checkbox
				}
			}
		},
		defaultValues: {
			email: '',
			username: '',
			password: '',
			confirmPassword: '',
			accountType: 'personal',
			terms: false
		},
		props: {
			className: "space-y-3"
		},
		action: {
			onSubmit: async (values) => {
				if (validatePasswords(values)) {
					try {
						await withRetry(
							() => auth.signup({
								email: values.email,
								username: values.username,
								password: values.password
							}),
							{
								onAttempt: (attempt) => {
									if (attempt > 1) {
										notify.default(`Retry attempt ${attempt}/3`);
									}
								},
								onMaxAttemptsReached: () => {
									notify.error(
										"Failed to create account",
										"Maximum retry attempts reached. Please try again later."
									);
								},
								onError: (error, attempt) => {
									console.error(error)
									if (attempt < 3) {
										notify.withAction(
											"Failed to create account",
											"Retry",
											() => {
												formMethods.reset({
													email: values.email,
													username: values.username,
													password: '',
													confirmPassword: ''
												});
											}
										);
									}
								},
								onSuccess: () => {
									notify.success("Account created successfully!");
									navigate({ to: search.redirect });
								},
								resetAction: () => {
									formMethods.reset({
										...values,
										password: '',
										confirmPassword: ''
									});
								}
							}
						);
					} catch (err) {
						console.error('Signup error:', err);
					}
				}
			},
			onError: (error) => {
				console.error('Form error:', error);
			},
		},
	})

	return (
		<div className="flex justify-center items-center px-4 py-8 min-h-screen bg-gray-50 sm:px-6 lg:px-8">
			<div className="space-y-6 w-full max-w-sm">
				<div>
					<h2 className="mt-6 text-3xl font-bold tracking-tight text-center text-gray-900">
						Create your account
					</h2>
					<p className="mt-2 text-sm text-center text-gray-600">
						Already have an account?{' '}
						<a
							href="/auth/login"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							Sign in
						</a>
					</p>
				</div>

				<SignupForm />

				<p className="text-xs text-center text-gray-500">
					By clicking "Create account", you agree to our{' '}
					<a href="/terms" className="underline">
						Terms of Service
					</a>{' '}
					and{' '}
					<a href="/privacy" className="underline">
						Privacy Policy
					</a>
					.
				</p>
			</div>
		</div>
	)
}
