import { z } from 'zod';

export const signupSchema = z.object({
	username: z
		.string()
		.min(2, 'Username must be at least 2 characters')
		.label('Username')
		.placeholder('Username'),
	email: z
		.string()
		.min(1)
		.email('Invalid email address')
		.label('Email address')
		.placeholder('Email address'),
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
});

export type SignupFormData = z.infer<typeof signupSchema>;
