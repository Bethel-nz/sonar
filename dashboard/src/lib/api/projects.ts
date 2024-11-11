import { api } from '../api';
import type { Project, ProjectStats, ProjectActivity } from '~/types';

interface ApiError {
  error: string;
  message?: string;
}

interface ProjectData {
  name: string;
  description?: string;
  projectUrl?: string;
  githubUrl?: string;
}

export const projectApi = {
  create: async (data: ProjectData): Promise<Project> => {
    
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    
    if (data.projectUrl?.trim()) {
      formData.append('projectLink', data.projectUrl);
    }
    if (data.githubUrl?.trim()) {
      formData.append('githubUrl', data.githubUrl);
    }
    
    try {
      const response = await api.post('projects/new', { 
        body: formData 
      }).json<{ project: Project } | ApiError>();
      
      if ('error' in response) {
        throw new Error(response.message || response.error);
      }
      return response.project;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create project');
      }
      throw new Error(error.message || 'Failed to create project');
    }
  },

  update: async (id: string, data: ProjectData): Promise<Project> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    
    if (data.projectUrl?.trim()) {
      formData.append('projectLink', data.projectUrl);
    }
    if (data.githubUrl?.trim()) {
      formData.append('githubUrl', data.githubUrl);
    }
    
    try {
      const response = await api.patch(`projects/${id}`, { 
        body: formData 
      }).json<{ project: Project } | ApiError>();
      
      if ('error' in response) {
        throw new Error(response.error);
      }
      return response.project;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  list: async (): Promise<Project[]> => {
    try {
      const response = await api.get('projects').json<{ dbProjects: Project[] } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
      return response.dbProjects;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  get: async (id: string): Promise<Project> => {
    try {
      const response = await api.get(`projects/${id}`).json<{ project: Project } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
      return response.project;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`projects/${id}`).json<{ message: string } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  getStats: async (projectId: string): Promise<ProjectStats> => {
    try {
      const response = await api.get(`projects/${projectId}/stats`).json<{ stats: ProjectStats } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
      return response.stats;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },

  getActivity: async (projectId: string): Promise<ProjectActivity[]> => {
    try {
      const response = await api.get(`projects/${projectId}/activity`).json<{ activity: ProjectActivity[] } | ApiError>();
      if ('error' in response) {
        throw new Error(response.error);
      }
      return response.activity;
    } catch (error: any) {
      if (error.response) {
        const errorData = await error.response.json();
        throw new Error(errorData.error);
      }
      throw error;
    }
  },
}; 