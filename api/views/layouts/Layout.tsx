/** @jsx jsx */
import { PropsWithChildren } from 'hono/jsx'

type LayoutProps = {
	title: string
}

export const Layout = ({ title, children }: PropsWithChildren<LayoutProps>) => (
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title> Sonar - {title}</title>
			<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,container-queries"></script>
			<script>
				{`
				tailwind.config = {
					theme: {
						extend: {
							colors: {
								'accent-1': '#6D28D9',
								'accent-2': '#5B21B6',
							}
						}
					}
				}
				`}
			</script>
		</head>
		<body class="flex h-screen bg-gray-100">
			<div class="flex flex-col w-64 bg-white">
				<div class="flex items-center justify-center h-16 text-purple-800">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 mr-2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
					</svg>
					<span class="text-xl font-semibold">Sonar</span>
				</div>
				<nav class="flex-grow">
					<ul class="space-y-2 py-4">
						<li>
							<a href="/" class="flex items-center px-8 py-2 hover:bg-gray-100 text-indigo-700">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
								</svg>
								Home
							</a>
						</li>
						<li>
							<a href="/projects" class="flex items-center px-8 py-2 hover:bg-gray-100 text-indigo-700">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
								</svg>
								Projects
							</a>
						</li>

					</ul>
				</nav>
			</div>
			<main class="flex-grow p-8 overflow-auto">
				{children}
			</main>
			<div class="fixed bottom-0 left-0 p-4">
				<form action="/api/v1/auth/logout" method="post">
					<button type="submit" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
						Logout
					</button>
				</form>
			</div>
		</body>
	</html>
)
