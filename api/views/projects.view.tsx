/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Context } from 'hono'
import { Layout } from './layouts/Layout'
import type { Project } from "~drizzle/models/projects"
import type { Workflow } from "~drizzle/models/workflows"
import { Notification } from './components/Notification'
import { getRedisClient } from "../src/utils/redis"

const ProjectsComponent = ({ projects = [], workflows = {}, error }: { projects: Project[], workflows: Record<string, Workflow[]>, error?: string }) => (
	<Layout title="Projects">
		<div class="sm:flex sm:items-center ">
			<div class="sm:flex-auto">
				<h1 class="text-base text-xl font-bold leading-6 text-gray-900">Projects</h1>
				<p class="mt-2 text-md text-gray-700">A list of all the projects in your account.</p>
			</div>
			<div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
				<button type="button" onclick="showNewProjectModal()" class="block rounded-md bg-[#6D28D9] px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-accent-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-lg focus-visible:outline-accent-1">Add project</button>
			</div>
		</div>

		{/* New Project Modal */}
		<div id="newProjectModal" class="hidden relative z-10" role="dialog" aria-modal="true">
			{/* Backdrop */}
			<div class="fixed inset-0 bg-gray-500 bg-opacity-25 opacity-0 transition-opacity duration-300 ease-out"
				id="modalBackdrop" onclick="closeNewProjectModal()"></div>

			<div class="overflow-y-auto fixed inset-0 z-10 p-4 w-screen sm:p-6 md:p-20">
				<div class="flex justify-center items-end p-4 min-h-full text-center sm:items-center sm:p-0">
					{/* Modal Content */}
					<div class="relative px-4 pt-5 pb-4 text-left bg-white rounded-lg shadow-xl opacity-0 transition-all duration-300 ease-out transform scale-95 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
						id="modalContent">
						<div class="absolute -top-3 -right-3 p-1 bg-white rounded-full shadow-sm cursor-pointer hover:bg-gray-50">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="transition-all duration-300 ease-out size-8 text-accent-1 hover:scale-110" onclick="closeNewProjectModal()">
								<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
							</svg>
						</div>

						<form id="newProjectForm" action="/api/v1/projects" method="post" class="space-y-6" enctype="multipart/form-data">
							<div>
								<label for="projectName" class="block text-lg font-medium leading-6 text-gray-900">Project Name</label>
								<p class="text-sm text-gray-500 mb-8"> Create a name for your project.</p>
								<div class="mt-2">
									<input type="text" name="name" id="projectName" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#6D28D9] sm:text-sm sm:leading-6" />
								</div>
							</div>
							<div class="mt-5 sm:mt-6 ">
								<button
									type="submit"
									class="inline-flex w-full justify-center rounded-md bg-[#6D28D9] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9] sm:col-start-2"
								>
									Create Project
								</button>

							</div>
						</form>
					</div>
				</div>
			</div>
		</div>

		{/* Project List */}
		<ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-16">
			{Array.isArray(projects) && projects.length > 0 ? (
				projects.map((project: Project) => (
					<li key={project.id} class="group col-span-1 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-accent-1 transition-all duration-300">
						<div class="p-4">
							{/* Project Card Header */}
							<div class="relative">
								{/* Action Buttons Container */}
								<div class="absolute -top-2 right-3 flex items-center p-1 space-x-1 bg-gray-50 rounded-lg shadow-sm">
									<button
										onclick={`showEditProjectModal(${JSON.stringify(project)})`}
										class="p-1.5 text-gray-400 hover:bg-white hover:text-accent-1 rounded-full transition-all"
										title="Edit project"
									>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
											<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
										</svg>
									</button>
									<button
										onclick={`showDeleteConfirmation('${project.id}')`}
										class="p-1.5 text-gray-400 hover:bg-white hover:text-red-500 rounded-full transition-all"
										title="Delete project"
									>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
											<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
										</svg>
									</button>
								</div>

								{/* Project Name */}
								<div class="pt-4">
									<h3 class="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
								</div>
							</div>

							{/* Project Details */}
							<div class="space-y-2 pt-3">
								{/* Project ID */}
								<div class="flex items-center justify-between group/item">
									<span class="text-sm text-gray-500">Project ID</span>
									<div class="flex items-center gap-2">
										<code class="text-sm font-mono bg-gray-50 px-2 py-1 rounded">{project.id}</code>
										<button
											onclick={`copyToClipboard('${project.id}')`}
											class="text-gray-400 hover:text-accent-1 transition-colors"
											title="Copy Project ID"
										>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
											</svg>
										</button>
									</div>
								</div>

								{/* API Key */}
								<div class="flex items-center justify-between group/item">
									<span class="text-sm text-gray-500">API Key</span>
									<div class="flex items-center gap-2">
										<code class="text-sm font-mono bg-gray-50 px-2 py-1 rounded">
											{project.apiKey.slice(0, 4)}****{project.apiKey.slice(-4)}
										</code>
										<button
											onclick={`copyToClipboard('${project.apiKey}')`}
											class="text-gray-400 hover:text-accent-1 transition-colors"
											title="Copy API Key"
										>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
											</svg>
										</button>
									</div>
								</div>
							</div>

							{/* View Workflows Button */}
							<button
								onclick={`showWorkflows('${project.id}')`}
								class="mt-3 w-full inline-flex items-center justify-center gap-2 group/workflows  rounded-lg bg-accent-1/5 px-4 py-2 text-sm font-semibold text-accent-1 hover:bg-accent-1/10 transition-colors"
							>
								View Workflows
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 group-hover/workflows:translate-x-1 transition-transform duration-300 ease-out">
									<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
								</svg>
							</button>
						</div>
					</li>
				))
			) : (
				<li class="col-span-full">
					<div class="text-center rounded-lg border-2 border-dashed border-gray-300 p-12">
						<svg
							class="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
							/>
						</svg>
						<h3 class="mt-2 text-sm font-semibold text-gray-900">No projects</h3>
						<p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
						<div class="mt-6">
							<button
								type="button"
								onclick="showNewProjectModal()"
								class="inline-flex items-center rounded-md bg-[#6D28D9] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
							>
								<svg
									class="-ml-0.5 mr-1.5 h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
									/>
								</svg>
								New Project
							</button>
						</div>
					</div>
				</li>
			)}
		</ul>

		{/* Notification */}
		<div id="notification" class="hidden fixed bottom-4 right-4">
			<div class="rounded-md p-4" id="notificationContainer">
				<div class="flex">
					<div class="flex-shrink-0" id="notificationIcon">
						{/* Icon will be dynamically updated */}
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium" id="notificationMessage"></p>
					</div>
					<div class="ml-auto pl-3">
						<div class="-mx-1.5 -my-1.5">
							<button type="button" onclick="closeNotification()" class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2" id="notificationDismiss">
								<span class="sr-only">Dismiss</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		{/* Edit Project Modal */}
		<div id="editProjectModal" class="hidden relative z-10" role="dialog" aria-modal="true">
			{/* Backdrop */}
			<div class="fixed inset-0 bg-gray-500 bg-opacity-25 opacity-0 transition-opacity duration-300 ease-out"
				id="editModalBackdrop" onclick="closeEditProjectModal()"></div>

			<div class="overflow-y-auto fixed inset-0 z-10 p-4 w-screen sm:p-6 md:p-20">
				<div class="flex justify-center items-end p-4 min-h-full text-center sm:items-center sm:p-0">
					{/* Modal Content */}
					<div class="relative px-4 pt-5 pb-4 text-left bg-white rounded-lg shadow-xl opacity-0 transition-all duration-300 ease-out transform scale-95 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
						id="editModalContent">
						<div class="absolute -top-3 -right-3 p-1 bg-white rounded-full shadow-sm cursor-pointer hover:bg-gray-50">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="transition-all duration-300 ease-out size-8 text-accent-1 hover:scale-110" onclick="closeEditProjectModal()">
								<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
							</svg>
						</div>

						<form id="editProjectForm" action="" method="post" class="space-y-6" enctype="multipart/form-data">
							<div>
								<label for="editProjectName" class="block text-sm font-medium leading-6 text-gray-900">Edit Project Name</label>
								<p class="text-sm text-gray-500">Edit the name of your project.</p>
								<div class="mt-2">
									<input type="text" name="name" id="editProjectName" required class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#6D28D9] sm:text-sm sm:leading-6" />
								</div>
							</div>
							<input type="hidden" name="id" id="editProjectId" />
							<button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#6D28D9] text-base font-medium text-white hover:bg-accent-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6D28D9] sm:text-sm">Save Changes</button>
						</form>
					</div>
				</div>
			</div>
		</div>

		{/* Workflows Dialog */}
		<div id="workflowsDialog" class="hidden fixed inset-0 z-10 overflow-y-auto">
			{/* Backdrop */}
			<div class="fixed inset-0 bg-gray-500 bg-opacity-25 opacity-0 transition-opacity duration-300 ease-out"
				id="workflowsBackdrop" onclick="closeWorkflowsDialog()"></div>

			<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
				<div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all opacity-0 scale-95 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
					id="workflowsContent">
					<div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
						<button type="button" onclick="closeWorkflowsDialog()" class="rounded-md bg-white text-gray-400 hover:text-gray-500">
							<span class="sr-only">Close</span>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<div class="sm:flex sm:items-start">
						<div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
							<h3 class="text-lg font-semibold leading-6 text-gray-900">Project Workflows</h3>
							<div class="mt-4" id="workflowsList">
								{/* Workflows will be dynamically inserted here */}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		{/* Delete Confirmation Modal */}
		<div id="deleteConfirmModal" class="hidden fixed inset-0 z-10" role="dialog" aria-modal="true">
			{/* Backdrop */}
			<div class="fixed inset-0 bg-gray-500 bg-opacity-25 opacity-0 transition-opacity duration-300 ease-out"
				id="deleteModalBackdrop" onclick="closeDeleteConfirmation()"></div>

			<div class="overflow-y-auto fixed inset-0 z-10 p-4 w-screen sm:p-6 md:p-20">
				<div class="flex justify-center items-end p-4 min-h-full text-center sm:items-center sm:p-0">
					{/* Modal Content */}
					<div class="relative px-4 pt-5 pb-4 text-left bg-white rounded-lg shadow-xl opacity-0 transition-all duration-300 ease-out transform scale-95 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
						id="deleteModalContent">
						<div class="sm:flex sm:items-start">
							<div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
								<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
								</svg>
							</div>
							<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
								<h3 class="text-base font-semibold leading-6 text-gray-900">Delete Project</h3>
								<div class="mt-2">
									<p class="text-sm text-gray-500">Are you sure you want to delete this project? This action cannot be undone.</p>
								</div>
							</div>
						</div>
						<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
							<button
								type="button"
								class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
								onclick="confirmDelete()"
							>
								Delete
							</button>
							<button
								type="button"
								class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
								onclick="closeDeleteConfirmation()"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		{error && <Notification message={error} type="error" />}
		<script dangerouslySetInnerHTML={{
			__html: `
		function copyToClipboard(text) {
			navigator.clipboard.writeText(text).then(() => {
				const notification = document.getElementById('notification');
				const notificationMessage = document.getElementById('notificationMessage');
				notificationMessage.textContent = text;
				notification.classList.remove('hidden');
				setTimeout(() => {
					notification.classList.add('hidden');
				}, 3000);
			}, (err) => {
				console.error('Could not copy text: ', err);
			});
		}

		function showEditProjectModal(project) {
			const modal = document.getElementById('editProjectModal');
			const backdrop = document.getElementById('editModalBackdrop');
			const content = document.getElementById('editModalContent');
			const projectNameInput = document.getElementById('editProjectName');
			const projectIdInput = document.getElementById('editProjectId');
			const form = document.getElementById('editProjectForm');
			
			const projectData = typeof project === 'string' ? JSON.parse(project) : project;

			form.action = \`/api/v1/projects/\${projectData.id}\`;
			projectNameInput.value = projectData.name;
			projectIdInput.value = projectData.id;

			modal.classList.remove('hidden');

			setTimeout(() => {
				backdrop.classList.remove('opacity-0');
				backdrop.classList.add('opacity-100');

				content.classList.remove('opacity-0', 'scale-95');
				content.classList.add('opacity-100', 'scale-100');
			}, 10);
		}

		function closeEditProjectModal() {
			const modal = document.getElementById('editProjectModal');
			const backdrop = document.getElementById('editModalBackdrop');
			const content = document.getElementById('editModalContent');

			backdrop.classList.remove('opacity-100');
			backdrop.classList.add('opacity-0');

			content.classList.remove('opacity-100', 'scale-100');
			content.classList.add('opacity-0', 'scale-95');

			setTimeout(() => {
				modal.classList.add('hidden');
			}, 300);
		}

		document.getElementById('editProjectForm').onsubmit = async function(event) {
			event.preventDefault();

			const form = event.target;
			const formData = new FormData(form);

			try {
				const response = await fetch(form.action, {
					method: 'PUT',
					body: formData,
				});

				if (response.ok) {
					window.location.reload();
					const successMessage = await response.text();
					showNotification(successMessage, 'success');
				} else {
					const errorText = await response.text();
					showNotification(errorText, 'error');
				}
				closeEditProjectModal();
			} catch (error) {
				showNotification('Request failed', 'error');
			}
		};

		window.showNewProjectModal = function () {
			const modal = document.getElementById('newProjectModal');
			const backdrop = document.getElementById('modalBackdrop');
			const content = document.getElementById('modalContent');

			modal.classList.remove('hidden');

			setTimeout(() => {
				backdrop.classList.remove('opacity-0');
				backdrop.classList.add('opacity-100');

				content.classList.remove('opacity-0', 'scale-95');
				content.classList.add('opacity-100', 'scale-100');
			}, 10);
		};

		window.closeNewProjectModal = function () {
			const modal = document.getElementById('newProjectModal');
			const backdrop = document.getElementById('modalBackdrop');
			const content = document.getElementById('modalContent');

			backdrop.classList.remove('opacity-100');
			backdrop.classList.add('opacity-0');

			content.classList.remove('opacity-100', 'scale-100');
			content.classList.add('opacity-0', 'scale-95');

			setTimeout(() => {
				modal.classList.add('hidden');
			}, 300);
		};

		// Modify showWorkflows to store current project ID
		async function showWorkflows(projectId) {
			const dialog = document.getElementById('workflowsDialog');
			const backdrop = document.getElementById('workflowsBackdrop');
			const content = document.getElementById('workflowsContent');
			const workflowsList = document.getElementById('workflowsList');
			
			dialog.setAttribute('data-project-id', projectId);
			
			// Get workflows for this project from the workflows prop
			const projectWorkflows = window.projectWorkflows[projectId] || [];
			
			if (projectWorkflows.length > 0) {
				workflowsList.innerHTML = \`
					<div class="grid grid-cols-1 gap-4">
						\${projectWorkflows.map(workflow => \`
							<div class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
								<h4 class="font-medium text-gray-900">\${workflow.name}</h4>
								<a href="/workflows/\${workflow.id}" class="mt-2 inline-flex items-center text-sm text-accent-1 hover:text-accent-2">
									View Details
									<svg class="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
									</svg>
								</a>
							</div>
						\`).join('')}
					</div>
				\`;
			} else {
				workflowsList.innerHTML = \`
					<div class="text-center py-12">
						<p class="text-sm text-gray-500">No workflows have been created for this project yet.</p>
					</div>
				\`;
			}
			
			dialog.classList.remove('hidden');
			
			// Animate in
			setTimeout(() => {
				backdrop.classList.remove('opacity-0');
				backdrop.classList.add('opacity-100');
				content.classList.remove('opacity-0', 'scale-95');
				content.classList.add('opacity-100', 'scale-100');
			}, 10);
		}

		function closeWorkflowsDialog() {
			const dialog = document.getElementById('workflowsDialog');
			const backdrop = document.getElementById('workflowsBackdrop');
			const content = document.getElementById('workflowsContent');

			// Animate out
			backdrop.classList.remove('opacity-100');
			backdrop.classList.add('opacity-0');
			content.classList.remove('opacity-100', 'scale-100');
			content.classList.add('opacity-0', 'scale-95');

			// Hide after animation
			setTimeout(() => {
				dialog.classList.add('hidden');
			}, 300);
		}

		function showNotification(message, type = 'success') {
			const notification = document.getElementById('notification');
			const container = document.getElementById('notificationContainer');
			const messageElement = document.getElementById('notificationMessage');
			const dismissButton = document.getElementById('notificationDismiss');
			const iconContainer = document.getElementById('notificationIcon');

			// Reset classes
			container.className = 'rounded-md p-4';
			messageElement.className = 'text-sm font-medium';
			dismissButton.className = 'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2';
			iconContainer.className = 'flex-shrink-0';

			// Update icon based on type
			switch (type) {
				case 'success':
					iconContainer.className = 'flex-shrink-0';
					container.className = 'rounded-md bg-green-50 p-4';
					messageElement.className = 'text-sm font-medium text-green-800';
					iconContainer.innerHTML = \`
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					\`;
					break;
				case 'error':
					iconContainer.className = 'flex-shrink-0';
					container.className = 'rounded-md bg-red-50 p-4';
					messageElement.className = 'text-sm font-medium text-red-800';
					iconContainer.innerHTML = \`
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					\`;
					break;
				default:
					iconContainer.className = 'flex-shrink-0';
					container.className = 'rounded-md bg-yellow-50 p-4';
					messageElement.className = 'text-sm font-medium text-yellow-800';
					iconContainer.innerHTML = \`
						<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
					\`;
					break;
			}

			messageElement.textContent = message;
			notification.classList.add('transform', 'ease-out', 'duration-300', 'transition', 'translate-y-2', 'opacity-0', 'sm:translate-y-0', 'sm:translate-x-2');
			notification.classList.remove('hidden');

			setTimeout(() => {
				notification.classList.remove('translate-y-2', 'opacity-0', 'sm:translate-y-0', 'sm:translate-x-2');
				notification.classList.add('translate-y-0', 'opacity-100', 'sm:translate-x-0');
			}, 500);

			setTimeout(() => {
				closeNotification();
			}, 5000);
		}

		function closeNotification() {
			const notification = document.getElementById('notification');
			
			notification.classList.remove('translate-y-0', 'opacity-100', 'sm:translate-x-0');
			notification.classList.add('translate-y-2', 'opacity-0', 'sm:translate-y-0', 'sm:translate-x-2');
			
			setTimeout(() => {
				notification.classList.add('hidden');
			}, 300);
		}

		let projectToDelete = null;

		function showDeleteConfirmation(projectId) {
			projectToDelete = projectId;
			const modal = document.getElementById('deleteConfirmModal');
			const backdrop = document.getElementById('deleteModalBackdrop');
			const content = document.getElementById('deleteModalContent');

			modal.classList.remove('hidden');
			
			setTimeout(() => {
				backdrop.classList.remove('opacity-0');
				backdrop.classList.add('opacity-100');
				content.classList.remove('opacity-0', 'scale-95');
				content.classList.add('opacity-100', 'scale-100');
			}, 10);
		}

		function closeDeleteConfirmation() {
			const modal = document.getElementById('deleteConfirmModal');
			const backdrop = document.getElementById('deleteModalBackdrop');
			const content = document.getElementById('deleteModalContent');

			backdrop.classList.remove('opacity-100');
			backdrop.classList.add('opacity-0');
			content.classList.remove('opacity-100', 'scale-100');
			content.classList.add('opacity-0', 'scale-95');

			setTimeout(() => {
				modal.classList.add('hidden');
				projectToDelete = null;
			}, 300);
		}

		async function confirmDelete() {
			if (!projectToDelete) return;

			try {
				const response = await fetch(\`/api/v1/projects/\${projectToDelete}\`, {
					method: 'DELETE',
				});

				if (response.ok) {
					showNotification('Project deleted successfully', 'success');
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				} else {
					const error = await response.json();
					showNotification(error.message || 'Failed to delete project', 'error');
				}
			} catch (error) {
				showNotification('Failed to delete project', 'error');
			}

			closeDeleteConfirmation();
		}

		function updateProjectsList(projects) {
			const projectsList = document.querySelector('ul[role="list"]');
			if (!projectsList) return;

			if (projects.length === 0) {
				projectsList.innerHTML = \`
					<li class="col-span-full">
						<div class="text-center rounded-lg border-2 border-dashed border-gray-300 p-12">
							<!-- Empty state content -->
						</div>
					</li>
				\`;
				return;
			}

			projectsList.innerHTML = projects.map(project => \`
				<li key="\${project.id}" class="group col-span-1 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-accent-1 transition-all duration-300">
					<!-- Project card content -->
				</li>
			\`).join('');
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
	`}} />
	</Layout >
)

export const ProjectsView = async (c: Context) => {
	try {
		const projects = await c.get('projects');
		const error = c.req.query('error');
		const workflows = c.get("workflows")


		return c.html(
			<ProjectsComponent
				projects={projects}
				workflows={workflows}
				error={error}
			/>
		);
	} catch (error) {
		console.error('Error in ProjectsView:', error);
		return c.html(
			<ProjectsComponent
				projects={[]}
				workflows={{}}
				error="Failed to load projects"
			/>
		);
	}
}

