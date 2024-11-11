'use client';

import { Drawer } from 'vaul';
import { Badge, BadgeVariant } from "~ui/badge";
import type { Event } from "~types";
import { X } from "lucide-react";
import { Button } from "~ui/button";
import { formatDistanceToNow } from "date-fns";
import { cx } from "~utils";
import { stateColors } from "~/lib/utils/colors"

interface SideDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	event: Event | null;
}

const severityColors = {
	info: stateColors.info,
	warn: stateColors.warn,
	error: stateColors.error,
	critical: stateColors.critical,
};

export function EventSideDrawer({ isOpen, onOpenChange, event }: SideDrawerProps) {
	if (!event) return null;

	const severityColor = severityColors[event.config.severity];

	return (
		<Drawer.Root open={isOpen} onOpenChange={onOpenChange} direction="right">
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 bg-black/40" />
				<Drawer.Content className="fixed right-0 top-0 bottom-0 w-[400px] flex flex-col bg-background">
					<div className={cx(
						"flex items-center justify-between p-4",
						severityColor.border,
						severityColor.bg,
						"border-b"
					)}>
						<div className="space-y-1">
							<Drawer.Title className={cx("text-lg font-semibold", severityColor.text)}>
								{event.name}
							</Drawer.Title>
							<div className="flex items-center gap-2">
								<Badge
									variant={event.config.severity as BadgeVariant}
									className="rounded-full opacity-80"
								>
									{event.config.severity}
								</Badge>
								<span className="text-sm text-muted-foreground">
									{formatDistanceToNow(new Date(event!.createdAt as Date), { addSuffix: true })}
								</span>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onOpenChange(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="flex-1 overflow-y-auto">
						<div className="p-6 space-y-6">
							{/* Description */}
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Description</h4>
								<p className="text-sm text-muted-foreground">
									{event.config.description}
								</p>
							</div>

							{/* Tags */}
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Tags</h4>
								<div className="flex flex-wrap gap-2">
									{event.config.tags.map(tag => (
										<Badge
											key={tag}
											variant="outline"
											className="rounded-full"
										>
											{tag}
										</Badge>
									))}
								</div>
							</div>

							{/* Next Event */}
							{event.nextEvent && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium">Next Event</h4>
									<p className="text-sm text-muted-foreground">
										{event.nextEvent}
									</p>
								</div>
							)}

							{/* Event Count */}
							{event.count > 1 && (
								<div className="space-y-2">
									<h4 className="text-sm font-medium">Occurrences</h4>
									<p className="text-sm text-muted-foreground">
										This event has occurred {event.count} times
									</p>
								</div>
							)}

							{/* Timestamp */}
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Timestamp</h4>
								<p className="text-sm text-muted-foreground">
									{event?.createdAt ? new Date(event.createdAt).toLocaleString() : ''}
								</p>
							</div>

							{/* Payload */}
							<div className="space-y-2">
								<h4 className="text-sm font-medium">Payload</h4>
								<div className="relative">
									<pre className="mt-2 rounded-md bg-muted p-4 overflow-auto max-h-[400px] text-sm">
										<code className="text-sm">
											{JSON.stringify(event.payload, null, 2)}
										</code>
									</pre>
								</div>
							</div>
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
} 