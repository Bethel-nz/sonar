import { createRootRouteWithContext } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

import type { AuthContext } from '~auth';
import View from '~layout/view';

interface MyRouterContext {
	queryClient: QueryClient;
	auth: AuthContext;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: View,
});
