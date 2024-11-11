import { Suspense } from 'react';
import { Link } from '@tanstack/react-router';
import {
	ChevronDownIcon,
	HomeIcon,
} from '@radix-ui/react-icons';
import { FolderIcon } from 'lucide-react';
import { Skeleton } from '~ui/skeleton';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { BREAKPOINTS } from '~/lib/constants';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarMenuSub,
} from '~/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~ui/collapsible';
import { ProjectsList } from "./projects/projects-list.tsx"
import { cx } from '~utils';


function ProjectsSkeleton() {
	return (
		<div className='space-y-2 p-4'>
			{[1, 2, 3].map((i) => (
				<Skeleton key={i} className='h-8 w-full rounded-md' />
			))}
		</div>
	);
}



export function AppSidebar() {
	const isMobile = useIsMobile(BREAKPOINTS.TABLET);

	return (
		<Sidebar>
			<SidebarContent className={isMobile ? 'px-2' : 'px-4'}>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<Link to='/'>
									<HomeIcon className='h-4 w-4' />
									<span className={isMobile ? 'sr-only' : ''}>Dashboard</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>

						<Collapsible className='group/collapsible'>
							<SidebarMenuItem className="flex items-center justify-between">
								<SidebarMenuButton asChild>
									<Link to='/projects' className="flex items-center gap-2">
										<FolderIcon className='h-4 w-4' />
										<span className={isMobile ? 'sr-only' : ''}>Projects</span>
									</Link>
								</SidebarMenuButton>

								<CollapsibleTrigger asChild>
									<button className="p-1 hover:bg-gray-100 rounded">
										<ChevronDownIcon
											className={cx(
												'h-4 w-4 transition-transform',
												'group-data-[state=open]/collapsible:rotate-180'
											)}
										/>
									</button>
								</CollapsibleTrigger>
							</SidebarMenuItem>

							<CollapsibleContent>
								<SidebarMenuSub>
									<Suspense fallback={<ProjectsSkeleton />}>
										<ProjectsList isMobile={isMobile} />
									</Suspense>
								</SidebarMenuSub>
							</CollapsibleContent>
						</Collapsible>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}


