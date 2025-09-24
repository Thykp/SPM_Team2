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

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  owner: string;
  collaborators: string[];
  deadline: string;
  parent?: string | null;
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
  createdat: string | null;
  title: string;
  tasklist: string[] | null;
  description: string;
  owner: string;
  collaborators: string[];
};

export type NewProjectRequest = {
  title: string;
  description: string;
  tasklist?: string[];
  owner: string;
  collaborators?: string[];
};

export const Project = {

  updateCollaborators: async (projectId: string, collaborators: string[]): Promise<{ success: boolean; project: any }> => {
    const url = `${KONG_BASE_URL}/organise-project/projects/${projectId}/collaborators`;
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

export const Task = {

  getAllTask: async (): Promise<Task[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/`;
    const { data } = await api.get<Task[]>(url);
    return data;
  },

  getTasksByUserId: async (userId: string): Promise<Task[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${userId}`;
    const { data } = await api.get<Task[]>(url);
    return data;
  },

  getTasksById: async (taskId: string): Promise<Task> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/id/${taskId}`;
    const { data } = await api.get<Task>(url);
    return data;
  },

  getTaskByIdWithOwner: async (taskId: string): Promise<Task & { ownerName: string; ownerDepartment: string }> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/id/${taskId}`;
    const { data } = await api.get<Task & { ownerName: string; ownerDepartment: string }>(url);
    return data;
  },
  
  createTask: async (newTask: Omit<Task, "id">): Promise<Task> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task`;
    const { data } = await api.post<Task>(url, newTask);
    return data;
  },

  updateTask: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${taskId}`;
    const { data } = await api.put<Task>(url, updates);
    return data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${taskId}`;
    await api.delete(url);
  },
};

export default api;
