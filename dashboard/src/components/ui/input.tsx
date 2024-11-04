import * as React from 'react';
import { cx } from '~utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cx(
					'flex px-3 py-2 w-full h-10 text-sm text-gray-900 bg-white border-0 bg-input',
					'ring-1 ring-inset ring-gray-300',
					'placeholder:text-gray-400',
					'focus:ring-2 focus:ring-inset focus:ring-gray-600',
					'disabled:cursor-not-allowed disabled:opacity-50',
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';

export { Input };
