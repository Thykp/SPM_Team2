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
  due_date: string;
};

// Services
export const Profile = {

  getAllUsers: async (): Promise<LiteUser[]> => {
    const url = `${KONG_BASE_URL}/profile/user/all`;
    const { data } = await api.get<LiteUser[]>(url);
    return data;
  },

};

export const Project = {

  updateCollaborators: async (projectId: string, collaborators: string[]): Promise<{ success: boolean; project: any }> => {
    const url = `${KONG_BASE_URL}/project/project/${projectId}/collaborators`;
    const { data } = await api.put<{ success: boolean; project: any }>(url, {
      collaborators,
    });
    return data;
  },
  
};

export const Task = {
  getTasksByUserId: async (userId: string): Promise<Task[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${userId}`;
    const { data } = await api.get<Task[]>(url);
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
