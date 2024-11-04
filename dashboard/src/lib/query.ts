import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

// Query keys
export const queryKeys = {
	projects: ['projects'] as const,
	project: (id: string) => ['project', id] as const,
	workflows: (projectId: string) => ['workflows', projectId] as const,
	workflow: (projectId: string, workflowId: string) => ['workflow', projectId, workflowId] as const,
	events: (workflowId: string) => ['events', workflowId] as const,
};
