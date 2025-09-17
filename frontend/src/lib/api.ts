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

export const Project = {

  updateCollaborators: async (projectId: string, collaborators: string[]): Promise<{ success: boolean; project: any }> => {
    const url = `${KONG_BASE_URL}/project/${projectId}/collaborators`;
    const { data } = await api.put<{ success: boolean; project: any }>(url, {
      collaborators,
    });
    return data;
  },
  
};

export default api;
