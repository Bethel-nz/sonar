import { useQuery } from '@tanstack/react-query';
import { projectApi } from '~/lib/api/projects';
import { QUERY_KEYS, REFRESH_INTERVAL } from '~/lib/constants';
import type { Project, ProjectStats, ProjectActivity } from '~/types';

export function useProject(projectId: string) {
  return useQuery<Project, Error>({
    queryKey: [QUERY_KEYS.project, projectId],
    queryFn: () => projectApi.get(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectStats(projectId: string) {
  return useQuery<ProjectStats, Error>({
    queryKey: [QUERY_KEYS.projectStats, projectId],
    queryFn: () => projectApi.getStats(projectId),
    enabled: Boolean(projectId),
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
}

export function useProjectActivity(projectId: string) {
  return useQuery<ProjectActivity[], Error>({
    queryKey: [QUERY_KEYS.projectActivity, projectId],
    queryFn: () => projectApi.getActivity(projectId),
    enabled: Boolean(projectId),
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
} 