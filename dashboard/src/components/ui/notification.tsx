import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Cross2Icon } from '@radix-ui/react-icons';
import { cx } from '~utils';

const notificationVariants = cva(
	'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
	{
		variants: {
			variant: {
				default: 'bg-background border-border',
				destructive:
					'destructive group border-destructive bg-destructive text-destructive-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

export interface NotificationProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof notificationVariants> {
	onClose?: () => void;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
	({ className, variant, onClose, children, ...props }, ref) => {
		return (
			<div ref={ref} className={cx(notificationVariants({ variant }), className)} {...props}>
				{children}
				{onClose && (
					<button
						onClick={onClose}
						className='absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100'
					>
						<Cross2Icon className='h-4 w-4' />
					</button>
				)}
			</div>
		);
	},
);
Notification.displayName = 'Notification';

export { Notification, notificationVariants };
