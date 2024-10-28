/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Context } from 'hono'
import { Layout } from './layouts/Layout'

const SignupComponent = () => (
	<Layout title="Sign Up">
		<div class="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
			<div class="w-full max-w-sm space-y-10">
				<div>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="mx-auto h-10 w-auto text-indigo-600">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
					</svg>
					<h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Sign up for an account</h2>
				</div>
				<form class="space-y-6" action="/api/v1/auth/signup" method="post">
					<div class="relative -space-y-px rounded-md shadow-sm">
						<div class="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-gray-300"></div>
						<div>
							<label for="username" class="sr-only">Username</label>
							<input id="username" name="username" type="text" required class="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Username" />
						</div>
						<div>
							<label for="email-address" class="sr-only">Email address</label>
							<input id="email-address" name="email" type="email" autocomplete="email" required class="relative block w-full border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Email address" />
						</div>
						<div>
							<label for="password" class="sr-only">Password</label>
							<input id="password" name="password" type="password" autocomplete="current-password" required class="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-100 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Password" />
						</div>
					</div>

					<div>
						<button type="submit" class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign up</button>
					</div>
				</form>

				<p class="text-center text-sm leading-6 text-gray-500">
					Already have an account?
					<a href="/auth/login" class="font-semibold text-indigo-600 hover:text-indigo-500">Log in</a>
				</p>
			</div>
		</div>
	</Layout>
)

export const SignupView = (c: Context) => c.html(<SignupComponent />)
