import { queryOptions } from '@tanstack/react-query';

import { projectApi } from '../api/projects';

export const projectsQueryOptions = queryOptions({
	queryKey: ['projects'],
	queryFn: () => projectApi.list(),
});

export const projectQueryOptions = (projectId: string) =>
	queryOptions({
		queryKey: ['projects', projectId],
		queryFn: () => projectApi.get(projectId),
	});
