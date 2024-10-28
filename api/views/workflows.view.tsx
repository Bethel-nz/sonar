/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Context } from 'hono'
import { Layout } from './layouts/Layout'
import { Workflow } from '../drizzle/models/workflows'
import { Notification } from './components/Notification'

const WorkflowsComponent = ({ workflows, error }: { workflows: Workflow[], error?: string }) => (
	<Layout title="Workflows">
		<div class="sm:flex sm:items-center">
			<div class="sm:flex-auto">
				<h1 class="text-base font-semibold leading-6 text-gray-900">Workflows</h1>
				<p class="mt-2 text-sm text-gray-700">A list of all the workflows in your project.</p>
			</div>
		</div>
		<div class="mt-8 flow-root">
			<div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
				<div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
					<table class="min-w-full divide-y divide-gray-300">
						<thead>
							<tr>
								<th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
								<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
								<th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
									<span class="sr-only">View</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{workflows.map((workflow) => (
								<tr key={workflow.id}>
									<td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{workflow.name}</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(workflow.createdAt!).toLocaleDateString()}</td>
									<td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
										<a href={`/workflows/${workflow.id}`} class="text-accent-1 hover:text-accent-2">View<span class="sr-only">, {workflow.name}</span></a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
		{error && <Notification message={error} type="error" />}
		<script>
			{`
			(function() {
				const error = "${error}";
				if (error) {
					showNotification(error, 'error');
				}
			})();

			// ... (notification functions) ...
			`}
		</script>
	</Layout >
)
export const WorkflowsView = async (c: Context) => {
	const workflows = await c.get('workflows');
	const error = c.req.query('error');
	return c.html(<WorkflowsComponent workflows={workflows} error={error} />)
}

