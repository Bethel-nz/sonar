import { Input } from '~ui/input';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export const CustomAuthInput = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
	return <Input ref={ref} className={className} {...props} />;
});
CustomAuthInput.displayName = 'CustomAuthInput';

export const CustomAuthPasswordInput = forwardRef<
	HTMLInputElement,
	InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
	return <Input type="password" ref={ref} className={className} {...props} />;
});
CustomAuthPasswordInput.displayName = 'CustomAuthPasswordInput';
