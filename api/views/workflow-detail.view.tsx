/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Context } from 'hono'
import { Layout } from './layouts/Layout'
import type { Workflow } from '~drizzle/models/workflows'
import type { Event } from '~drizzle/models/events'

const WorkflowDetailComponent = ({
	workflow,
	events,
	project
}: {
	workflow: Workflow;
	events: Event[];
	project: any;
}) => (
	<Layout title={`${workflow.name} - Events`}>
		{/* Header with Project/Workflow name */}
		<div class="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
			<div>
				<div class="flex items-center gap-x-3">
					<div class="flex-none rounded-full bg-green-400/10 p-1 text-green-400">
						<div class="h-2 w-2 rounded-full bg-current"></div>
					</div>
					<h1 class="flex gap-x-3 text-base leading-7">
						<span class="font-semibold text-gray-900">{project.name}</span>
						<span class="text-gray-500">/</span>
						<span class="font-semibold text-gray-900">{workflow.name}</span>
					</h1>
				</div>
			</div>
		</div>

		{/* Event Statistics */}
		<div class="grid grid-cols-1 bg-white sm:grid-cols-2 lg:grid-cols-4">
			<div class="border-t border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
				<p class="text-sm font-medium leading-6 text-gray-600">Total Events</p>
				<p class="mt-2 flex items-baseline gap-x-2">
					<span class="text-4xl font-semibold tracking-tight text-gray-900">{events.length}</span>
				</p>
			</div>
			<div class="border-t border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
				<p class="text-sm font-medium leading-6 text-gray-600">Latest Event</p>
				<p class="mt-2 flex items-baseline gap-x-2">
					<span class="text-sm text-gray-700">
						{events.length > 0
							? new Date(events[0].createdAt!).toLocaleDateString()
							: 'No events yet'}
					</span>
				</p>
			</div>
			<div class="border-t border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
				<p class="text-sm font-medium leading-6 text-gray-600">Unique Events</p>
				<p class="mt-2 flex items-baseline gap-x-2">
					<span class="text-4xl font-semibold tracking-tight text-gray-900">
						{new Set(events.map(e => e.name)).size}
					</span>
				</p>
			</div>
			<div class="border-t border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
				<p class="text-sm font-medium leading-6 text-gray-600">Total Services</p>
				<p class="mt-2 flex items-baseline gap-x-2">
					<span class="text-4xl font-semibold tracking-tight text-gray-900">
						{new Set(events.flatMap(e => e.services)).size}
					</span>
				</p>
			</div>
		</div>

		{/* Event List with Preview */}
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
			<div class="mx-auto max-w-3xl divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5">
				{/* Search Input */}
				<div class="relative">
					<svg class="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
						<path d="M8.5 3a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 8.5a6.5 6.5 0 1111.269 4.438l3.584 3.584a1 1 0 11-1.414 1.414l-3.584-3.584A6.5 6.5 0 012 8.5z" />
					</svg>
					<input
						type="text"
						class="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
						placeholder="Search events..."
						id="searchEvents"
					/>
				</div>

				{/* Event List and Preview Split */}
				<div class="flex divide-x divide-gray-100">
					{/* Event List */}
					<div class="max-h-96 min-w-0 flex-auto overflow-y-auto px-6 py-4" id="eventsList">
						{events.length > 0 ? events.map(event => (
							<div
								class="group flex cursor-pointer select-none items-center rounded-md p-2 hover:bg-gray-50"
								onclick={`showEventDetails('${event.id}')`}
								key={event.id}
							>
								<div class="flex-auto">
									<div class="flex items-center justify-between">
										<p class="text-sm font-medium text-gray-900">{event.name}</p>
										<span class="ml-2 text-xs text-gray-500">
											{new Date(event.createdAt!).toLocaleTimeString()}
										</span>
									</div>
									<p class="mt-1 text-xs text-gray-500">
										{event.services.join(', ')}
									</p>
								</div>
							</div>
						)) : (
							<div class="text-center py-12">
								<p class="text-sm text-gray-500">No events found</p>
							</div>
						)}
					</div>

					{/* Event Preview */}
					<div id="eventPreview" class="hidden w-1/2 flex-none flex-col divide-y divide-gray-100 overflow-y-auto sm:flex">
						<div class="flex-none p-6 text-center">
							<h3 class="text-base font-semibold leading-6 text-gray-900">Event Details</h3>
						</div>
						<div class="flex flex-auto flex-col justify-between p-6">
							<dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm text-gray-700" id="eventDetails">
								{/* Event details will be dynamically inserted here */}
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>

		<script dangerouslySetInnerHTML={{
			__html: `
				let events = ${JSON.stringify(events)};
				let pollingInterval;
				
				// Start polling when page loads
				startPolling();
				
				function startPolling() {
					fetchEvents();
					
					pollingInterval = setInterval(fetchEvents, 1000);
				}
				
				async function fetchEvents() {
					try {
						const response = await fetch(window.location.href + '/events');
						if (!response.ok) throw new Error('Failed to fetch events');
						
						const newEvents = await response.json();
						
						// Check if we have new events
						if (JSON.stringify(newEvents) !== JSON.stringify(events)) {
							events = newEvents;
							renderEventsList(events);
							
							// If event preview is open, refresh it
							const preview = document.getElementById('eventPreview');
							if (!preview.classList.contains('hidden')) {
								const currentEventId = preview.getAttribute('data-event-id');
								if (currentEventId) {
									showEventDetails(currentEventId);
								}
							}
						}
					} catch (error) {
						console.error('Error fetching events:', error);
					}
				}

				// Modify showEventDetails to store current event ID
				function showEventDetails(eventId) {
					const event = events.find(e => e.id === eventId);
					if (!event) return;

					const preview = document.getElementById('eventPreview');
					const details = document.getElementById('eventDetails');
					
					preview.setAttribute('data-event-id', eventId);
					
					details.innerHTML = \`
						<dt class="font-semibold text-gray-900">Event Name</dt>
						<dd>\${event.name}</dd>
						
						<dt class="font-semibold text-gray-900">Services</dt>
						<dd>\${event.services.join(', ')}</dd>
						
						<dt class="font-semibold text-gray-900">Severity</dt>
						<dd>\${event.config.severity}</dd>
						
						<dt class="font-semibold text-gray-900">Description</dt>
						<dd>\${event.config.description}</dd>
						
						<dt class="font-semibold text-gray-900">Tags</dt>
						<dd>\${event.config.tags.join(', ')}</dd>
						
						<dt class="font-semibold text-gray-900">Payload</dt>
						<dd class="font-mono text-xs bg-gray-50 p-2 rounded">
							<pre>\${JSON.stringify(event.payload, null, 2)}</pre>
						</dd>
					\`;
					
					preview.classList.remove('hidden');
				}

				// Clean up polling when page is hidden/closed
				document.addEventListener('visibilitychange', () => {
					if (document.hidden) {
						clearInterval(pollingInterval);
					} else {
						startPolling();
					}
				});

				// Clean up on page unload
				window.addEventListener('beforeunload', () => {
					clearInterval(pollingInterval);
				});

				// Search functionality
				document.getElementById('searchEvents').addEventListener('input', (e) => {
					const searchTerm = e.target.value.toLowerCase();
					const filteredEvents = events.filter(event => 
						event.name.toLowerCase().includes(searchTerm) ||
						event.services.some(s => s.toLowerCase().includes(searchTerm)) ||
						event.config.tags.some(t => t.toLowerCase().includes(searchTerm))
					);
					
					renderEventsList(filteredEvents);
				});

				function renderEventsList(eventsToRender) {
					const listElement = document.getElementById('eventsList');
					
					if (eventsToRender.length === 0) {
						listElement.innerHTML = \`
							<div class="text-center py-12">
								<p class="text-sm text-gray-500">No events found</p>
							</div>
						\`;
						return;
					}

					listElement.innerHTML = eventsToRender.map(event => \`
						<div 
							class="group flex cursor-pointer select-none items-center rounded-md p-2 hover:bg-gray-50"
							onclick="showEventDetails('\${event.id}')"
						>
							<div class="flex-auto">
								<div class="flex items-center justify-between">
									<p class="text-sm font-medium text-gray-900">\${event.name}</p>
									<span class="ml-2 text-xs text-gray-500">
										\${new Date(event.createdAt).toLocaleTimeString()}
									</span>
								</div>
								<p class="mt-1 text-xs text-gray-500">
									\${event.services.join(', ')}
								</p>
							</div>
						</div>
					\`).join('');
				}
			`
		}} />
	</Layout>
)

export const WorkflowDetailView = async (c: Context) => {
	const workflow = c.get('workflow');
	const project = c.get('project');
	const events = await c.get('events');
	return c.html(<WorkflowDetailComponent workflow={workflow} events={events} project={project} />)
}
