/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Layout } from './layouts/Layout'
import { Context } from "hono"

const Notification = ({ message, type }: { message: string, type: 'success' | 'error' }) => (
	<div id="notification" class="hidden fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
		<div class="w-full flex flex-col items-center space-y-4 sm:items-end">
			<div class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
				<div class="p-4">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							{type === 'success' ? (
								<svg class="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							) : (
								<svg class="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							)}
						</div>
						<div class="ml-3 w-0 flex-1 pt-0.5">
							<p class="text-sm font-medium text-gray-900">
								{message}
							</p>
						</div>
						<div class="ml-4 flex-shrink-0 flex">
							<button onclick="closeNotification()" class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
								<span class="sr-only">Close</span>
								<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
)

const LoginComponent = ({ error }: { error?: string }) => (
	<Layout title="Login">
		<div class="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
			<div class="w-full max-w-sm space-y-10">
				<div>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-10 w-auto text-indigo-600">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
					</svg>
					<h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Sign in to your account</h2>
				</div>
				<form class="space-y-6" action="/api/v1/auth/login" method="post">
					<div class="relative -space-y-px rounded-md shadow-sm">
						<div class="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-gray-300"></div>
						<div>
							<label for="email-address" class="sr-only">Email address</label>
							<input id="email-address" name="email" type="email" autocomplete="email" required class="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Email address" />
						</div>
						<div>
							<label for="password" class="sr-only">Password</label>
							<input id="password" name="password" type="password" autocomplete="current-password" required class="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Password" />
						</div>
					</div>

					<div>
						<button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</button>
					</div>
				</form>

				<p class="text-center text-sm leading-6 text-gray-500">
					Not a member?
					<a href="/auth/signup" class="font-semibold text-indigo-600 hover:text-indigo-500">Start a 14-day free trial</a>
				</p>
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

			function showNotification(message, type) {
				const notification = document.getElementById('notification');
				notification.classList.remove('hidden');
				notification.classList.add('transform', 'ease-out', 'duration-300', 'transition', 'translate-y-2', 'opacity-0', 'sm:translate-y-0', 'sm:translate-x-2');
				
				setTimeout(() => {
					notification.classList.remove('translate-y-2', 'opacity-0', 'sm:translate-y-0', 'sm:translate-x-2');
					notification.classList.add('translate-y-0', 'opacity-100', 'sm:translate-x-0');
				}, 100);

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
			`}
		</script>
	</Layout>
)

export const LoginView = (ctx: Context) => {
	const error = ctx.req.query('error');
	return ctx.html(<LoginComponent error={error} />)
}
