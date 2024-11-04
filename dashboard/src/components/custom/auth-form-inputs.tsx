import React from 'react'
import { InputProps } from '~ui/input'
import { cx } from '~utils'
import { Eye, EyeOff } from 'lucide-react'

export const CustomAuthPasswordInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
	const [showPassword, setShowPassword] = React.useState(false);

	return (
		<div className="relative">
			<input
				ref={ref}
				type={showPassword ? "text" : "password"}
				className={cx(
					"block relative px-4 py-3 w-full text-gray-900 bg-white border-0",
					"ring-1 ring-inset ring-gray-300",
					"placeholder:text-gray-400",
					"focus:z-10 focus:ring-2 focus:ring-inset focus:ring-gray-600",
					"sm:text-sm sm:leading-6",
					"pr-10",
					className
				)}
				{...props}
			/>
			<button
				type="button"
				onClick={() => setShowPassword(!showPassword)}
				className={cx(
					"flex absolute inset-y-0 right-0 items-center pr-3",
					"text-gray-400 hover:text-gray-500",
					"focus:outline-none focus:text-gray-500"
				)}
			>
				{showPassword ? (
					<EyeOff className="w-4 h-4" aria-hidden="true" />
				) : (
					<Eye className="w-4 h-4" aria-hidden="true" />
				)}
			</button>
		</div>
	);
});

export const CustomAuthInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
	if (type === 'password') {
		return <CustomAuthPasswordInput ref={ref} className={className} {...props} />;
	}

	return (
		<input
			ref={ref}
			type={type}
			className={cx(
				"block relative px-4 py-3 w-full text-gray-900 bg-white border-0",
				"ring-1 ring-inset ring-gray-300",
				"placeholder:text-gray-800",
				"focus:z-10 focus:ring-2 focus:ring-inset focus:ring-gray-600",
				"sm:text-sm sm:leading-6",
				className
			)}
			{...props}
		/>
	);
});

export const CustomAuthForm = ({ children, ...props }: { children: React.ReactNode }) => {
	return (
		<div className="w-full" {...props}>
			<div className="relative">
				<div className="flex flex-wrap">
					{React.Children.map(children, (child) => {
						if (!React.isValidElement(child)) return null;
						return (
							<div className={cx(
								'w-full',
								'mb-4'
							)}>
								{child}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

// Add display names for better debugging
CustomAuthPasswordInput.displayName = 'CustomAuthPasswordInput';
CustomAuthInput.displayName = 'CustomAuthInput';
CustomAuthForm.displayName = 'CustomAuthForm';