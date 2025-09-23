import axios from "axios";

const KONG_BASE_URL = import.meta.env.VITE_KONG_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: KONG_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Types
export type LiteUser = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

// Services
export const Profile = {

  getAllUsers: async (): Promise<LiteUser[]> => {
    const url = `${KONG_BASE_URL}/profile/user/all`;
    const { data } = await api.get<LiteUser[]>(url);
    return data;
  },

};

// Project API types
export type ProjectDto = {
  id: string;
  created_at: string | null;
  title: string;
  task_list: string[] | null;
  description: string;
  owner: string;
  collaborators: string[];
};

export type NewProjectRequest = {
  title: string;
  description: string;
  task_list?: string[];
  owner: string;
  collaborators?: string[];
};

export const Project = {

  updateCollaborators: async (projectId: string, collaborators: string[]): Promise<{ success: boolean; project: any }> => {
    const url = `${KONG_BASE_URL}/project/project/${projectId}/collaborators`;
    const { data } = await api.put<{ success: boolean; project: any }>(url, {
      collaborators,
    });
    return data;
  },

  create: async (projectData: NewProjectRequest): Promise<ProjectDto> => {
    const url = `${KONG_BASE_URL}/organise-project/projects`;
    const { data } = await api.post<ProjectDto>(url, projectData);
    return data;
  },

  getAll: async (): Promise<ProjectDto[]> => {
    const url = `${KONG_BASE_URL}/organise-project/projects`;
    const { data } = await api.get<ProjectDto[]>(url);
    return data;
  },

  getByUser: async (userId: string): Promise<ProjectDto[]> => {
    const url = `${KONG_BASE_URL}/organise-project/projects/user/${userId}`;
    const { data } = await api.get<ProjectDto[]>(url);
    return data;
  },
  
};

export default api;
