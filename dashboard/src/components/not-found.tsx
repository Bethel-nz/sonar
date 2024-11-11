import { Link } from '@tanstack/react-router';

export function NotFound() {
	return (
		<div className='min-h-screen flex flex-col items-center justify-center'>
			<div className='text-center'>
				<h1 className='text-6xl font-bold text-gray-900'>404</h1>
				<p className='mt-4 text-xl text-gray-600'>Page not found</p>
				<p className='mt-2 text-gray-500'>
					The page you're looking for doesn't exist or has been moved.
				</p>
				<Link
					to='/'
					className='mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500'
				>
					Go back home
				</Link>
			</div>
		</div>
	);
}
