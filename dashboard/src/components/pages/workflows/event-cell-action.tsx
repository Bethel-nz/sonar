import { useState } from 'react';
import { MoreHorizontal, Info, ExternalLink } from 'lucide-react';
import { Button } from '~ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '~ui/dropdown-menu';
import type { Event } from '~/types';
import { Drawer } from 'vaul';
import { Badge } from '~ui/badge';
import { Separator } from '~ui/separator';

interface EventCellActionProps {
	data: Event;
}

export function EventCellAction({ data }: EventCellActionProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-8 w-8 p-0">
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem onClick={() => setOpen(true)}>
						<Info className="mr-2 h-4 w-4" /> View Details
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Drawer.Root open={open} onOpenChange={setOpen}>
				<Drawer.Portal>
					<Drawer.Overlay className="fixed inset-0 bg-black/40" />
					<Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[96%] mt-24 fixed bottom-0 left-0 right-0">
						<div className="p-4 bg-background rounded-t-[10px] flex-1">
							<div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8" />
							<div className="max-w-3xl mx-auto">
								<Drawer.Title className="font-bold text-2xl mb-4">
									{data.name}
								</Drawer.Title>

								<div className="space-y-6">
									<div>
										<h3 className="font-semibold mb-2">Event Details</h3>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<div className="text-sm text-muted-foreground">Severity</div>
												<Badge variant={
													data.config.severity === 'critical' || data.config.severity === 'error'
														? 'destructive'
														: data.config.severity === 'warn'
															? 'secondary'
															: 'default'
												}>
													{data.config.severity}
												</Badge>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">Trigger Count</div>
												<div className="font-mono">{data.count}</div>
											</div>
										</div>
									</div>

									<Separator />

									<div>
										<h3 className="font-semibold mb-2">Services</h3>
										<div className="flex gap-2 flex-wrap">
											{data.services.map(service => (
												<Badge key={service} variant="secondary">
													{service}
												</Badge>
											))}
										</div>
									</div>

									<Separator />

									<div>
										<h3 className="font-semibold mb-2">Description</h3>
										<p className="text-muted-foreground">
											{data.config.description}
										</p>
									</div>

									<Separator />

									<div>
										<h3 className="font-semibold mb-2">Tags</h3>
										<div className="flex gap-2 flex-wrap">
											{data.config.tags.map(tag => (
												<Badge key={tag} variant="outline">
													{tag}
												</Badge>
											))}
										</div>
									</div>

									<Separator />

									<div>
										<h3 className="font-semibold mb-2">Payload</h3>
										<pre className="bg-muted p-4 rounded-lg overflow-auto">
											<code>{JSON.stringify(data.payload, null, 2)}</code>
										</pre>
									</div>
								</div>
							</div>
						</div>
					</Drawer.Content>
				</Drawer.Portal>
			</Drawer.Root>
		</>
	);
} 