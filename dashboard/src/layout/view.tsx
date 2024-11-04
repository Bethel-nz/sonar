import { Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

function View() {
	return (
		<div className='flex flex-col min-h-screen'>
			<Toaster closeButton />

			<main className='flex-grow'>
				<Outlet />
			</main>
		</div>
	);
}

export default View;
