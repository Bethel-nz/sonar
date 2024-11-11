import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "~utils"
import { stateColors, type StateColor } from "~/lib/utils/colors"

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				info: cx(
					stateColors.info.bg,
					stateColors.info.text,
					stateColors.info.border,
				),
				warn: cx(
					stateColors.warn.bg,
					stateColors.warn.text,
					stateColors.warn.border,
				),
				error: cx(
					stateColors.error.bg,
					stateColors.error.text,
					stateColors.error.border,
				),
				critical: cx(
					stateColors.critical.bg,
					stateColors.critical.text,
					stateColors.critical.border,
				),
				success: cx(
					stateColors.success.bg,
					stateColors.success.text,
					stateColors.success.border,
				),
				default: cx(
					stateColors.default.bg,
					stateColors.default.text,
					stateColors.default.border,
				),
				outline: "border-border bg-background hover:bg-muted/50",
				active: cx(
					"bg-primary/10",
					"text-primary",
					"border-primary/20"
				),
				secondary: cx(
					"bg-secondary",
					"text-secondary-foreground",
					"border-secondary/20"
				),
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement> {
	variant: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
	return (
		<div className={cx(badgeVariants({ variant }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
