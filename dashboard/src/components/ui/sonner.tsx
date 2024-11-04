import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';
import { cva /*type VariantProps*/ } from 'class-variance-authority';
import { cx } from '~utils';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const toastVariants = cva(
	'group toast group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
	{
		variants: {
			variant: {
				default: 'group-[.toaster]:bg-background',
				destructive: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground',
				success: 'group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className='toaster group'
			toastOptions={{
				classNames: {
					toast: cx(toastVariants({ variant: 'default' }), 'group-[.toaster]:border'),
					description: 'group-[.toast]:text-muted-foreground',
					actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
					cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
					error: toastVariants({ variant: 'destructive' }),
					success: toastVariants({ variant: 'success' }),
				},
			}}
			{...props}
		/>
	);
};

// Helper functions for consistent toast usage
const notify = {
	default: (message: string, description?: string) => {
		toast(message, { description });
	},
	success: (message: string, description?: string) => {
		toast.success(message, { description });
	},
	error: (message: string, description?: string) => {
		toast.error(message, { description });
	},
	promise: <T,>(
		promise: Promise<T>,
		{
			loading = 'Loading...',
			success = 'Success!',
			error = 'Error!',
		}: {
			loading?: string;
			success?: string | ((data: T) => string);
			error?: string | ((error: unknown) => string);
		} = {},
	) => {
		toast.promise(promise, {
			loading,
			success,
			error,
		});
	},
	withAction: (message: string, label: string, event: () => void) => {
		toast(message, {
			action: {
				label,
				onClick: () => event(),
			},
		});
	},
};

export { Toaster, notify };
