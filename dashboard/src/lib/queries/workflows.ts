import { useQuery, queryOptions } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { workflowApi } from '~/lib/api/workflows';
import { projectApi } from '~/lib/api/projects';
import { QUERY_KEYS, REFRESH_INTERVAL } from '~/lib/constants';
import type { ProjectStats, Workflow } from '~/types';

export const workflowsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.workflows, projectId],
    queryFn: () => workflowApi.list(projectId),
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

export const workflowQueryOptions = (projectId: string, workflowName: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.workflow, projectId, workflowName],
    queryFn: () => workflowApi.get(projectId, workflowName),
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

export const workflowEventsQueryOptions = (projectId: string, workflowName: string) =>
  queryOptions({
    queryKey: [QUERY_KEYS.workflowEvents, projectId, workflowName],
    queryFn: () => workflowApi.getEvents(projectId, workflowName),
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

export function useWorkflows(projectId: string) {
  return useQuery(workflowsQueryOptions(projectId));
}

export function useProjectStats(projectId: string) {
  return useQuery<ProjectStats, Error>({
    queryKey: [QUERY_KEYS.projectStats, projectId],
    queryFn: async () => {
      return projectApi.getStats(projectId);
    },
    enabled: Boolean(projectId),
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
}

export function useWorkflow(projectId: string, workflowName: string) {
  return useQuery(workflowQueryOptions(projectId, workflowName));
}

export function useWorkflowEvents(projectId: string, workflowName: string) {
  return useQuery(workflowEventsQueryOptions(projectId, workflowName));
} 