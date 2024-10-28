/** @jsx jsx */
import { jsx } from 'hono/jsx'
import { Context } from 'hono'
import { Layout } from './layouts/Layout'

const HomeComponent = () => (
	<Layout title="Home">
		<div class="bg-white">
			{/* Hero Section */}
			<div class="relative isolate px-6 pt-14 lg:px-8">
				<div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
					<div class="text-center">
						<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
							Monitor your application events with ease
						</h1>
						<p class="mt-6 text-lg leading-8 text-gray-600">
							Track, manage, and respond to events across your applications in real-time.
							Get notified through multiple channels including Discord, Telegram, and Email.
						</p>
						<div class="mt-10 flex items-center justify-center gap-x-6">
							<a
								href="/projects"
								class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
							>
								View Projects
							</a>
							<a href="https://github.com/bethel-nz/sonar" class="text-sm font-semibold leading-6 text-gray-900">
								View Documentation <span aria-hidden="true">→</span>
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div class="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
				<div class="mx-auto max-w-2xl lg:text-center">
					<h2 class="text-base font-semibold leading-7 text-indigo-600">Event Monitoring</h2>
					<p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
						Everything you need to monitor your application
					</p>
					<p class="mt-6 text-lg leading-8 text-gray-600">
						Get started in minutes with our simple SDK and comprehensive dashboard.
					</p>
				</div>
				<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
					<dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
						{/* Real-time Monitoring */}
						<div class="flex flex-col">
							<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-none text-indigo-600">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
								</svg>
								Not So Real-time Monitoring
							</dt>
							<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
								<p class="flex-auto">Monitor your application events in real-time with instant notifications through multiple channels.</p>
							</dd>
						</div>

						{/* Multi-channel Notifications */}
						<div class="flex flex-col">
							<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-none text-indigo-600">
									<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
								</svg>
								Multi-channel Notifications
							</dt>
							<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
								<p class="flex-auto">Get notified through Discord, Telegram, Email, and more. Choose the channels that work best for your team.</p>
							</dd>
						</div>

						{/* Easy Integration */}
						<div class="flex flex-col">
							<dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-none text-indigo-600">
									<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
								</svg>
								Easy Integration
							</dt>
							<dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
								<p class="flex-auto">Simple SDK with TypeScript support. Integrate with your application in minutes.</p>
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	</Layout>
)

export const HomeView = (ctx: Context) => { return ctx.html(<HomeComponent />) }

