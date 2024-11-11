import { Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { AppSidebar } from '~/components/layout/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { useAuth } from '~/auth';
import { ModalProvider } from '~/components/providers/modal-provider';

function View() {
	const { isAuthenticated } = useAuth();

	return (
		<div>
			<ModalProvider>
				<SidebarProvider>
					<div className='flex min-h-screen w-full'>
						{isAuthenticated && <AppSidebar />}
						<main className='flex-1'>
							{isAuthenticated && <SidebarTrigger />}
							<Toaster />
							<Outlet />

						</main>
					</div>
				</SidebarProvider>
			</ModalProvider>
		</div>
	);
}
export default View;

