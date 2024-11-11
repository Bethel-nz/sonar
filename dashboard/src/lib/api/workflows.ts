import { api } from '../api';
import type { Workflow, Event } from '~/types';

interface ApiError {
  error: string;
}

export const workflowApi = {
  list: async (projectId: string): Promise<Workflow[]> => {
    try {
      const response = await api.get(`projects/${projectId}/workflows`).json<{ projectWorkflows: Workflow[] } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
	  console.log("Workflows", response.projectWorkflows)
      return response.projectWorkflows ?? [];
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  get: async (projectId: string, workflowName: string): Promise<Workflow | null> => {
    try {
      const response = await api.get(`projects/${projectId}/workflows/${workflowName}`).json<{ workflow: Workflow | null } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
      console.log(workflowName, "all", response.workflow)
      return response.workflow;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  getEvents: async (projectId: string, workflowName: string): Promise<Event[]> => {
    try {
      const response = await api.get(`projects/${projectId}/workflows/${workflowName}/events`).json<{ events: Event[] } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
      return response.events;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },
}; 