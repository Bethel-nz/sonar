import { z } from 'zod';

export const loginSchema = z.object({
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
});
