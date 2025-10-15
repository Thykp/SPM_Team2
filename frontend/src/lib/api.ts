import axios from "axios";

const KONG_BASE_URL = import.meta.env.VITE_KONG_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: KONG_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ----- Types -----
export type TaskPostRequestDto = {
  title: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  owner: string | null;
  collaborators: string[];
  deadline: string;
  project_id?: string | null;
  parent?: string | null;
  priority: number; // Priority (1-10) required by atomic service
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  owner: string | null;
  collaborators: string[];
  deadline: string;
  parent?: string | null;
  project_id?: string | null;
  ownerName?: string;
  ownerDepartment?: string;
  priority?: number;
};

export type ProjectDto = {
  id: string;
  created_at: string | null;
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
  ownerId: string;
  collaborators?: string[];
};

export type Profile = {
  department: string;
  role: string;
  display_name?: string;
  teams?: string[];
};

export type ProfileRequestDetailsDto = {
  id:string;
}

export type Notification = {
  id: string;                 
  to_user_id: string;         
  from_user_id: string;    
  from_username: string;  
  notif_type: string;         
  resource_type: string;      
  resource_id?: string;       
  project_id?: string;        
  task_priority?: number;     
  notif_text: string;
  link_url?: string;          
  read: boolean;
  user_set_read: boolean;
};

// ----- Services -----
export const Profile = {
  getAllUsers: async (): Promise<Array<{ id: string; display_name: string; role: string; department: string }>> => {
    const url = `${KONG_BASE_URL}/manage-account/api/users`;
    const { data } = await api.get<Array<{ id: string; display_name: string; role: string; department: string }>>(url);
    return data;
  },

  getProfileDetailsWithId: async (listOfUserIds: ProfileRequestDetailsDto[]): Promise<Profile[]> =>{
    const url = `${KONG_BASE_URL}/manage-account/api/users/getUserDetails`;
    const { data } = await api.post<Profile[]>(url, listOfUserIds);
    return data;
  }
};

export type UpdateProjectRequest = {
  title?: string;
  description?: string;
  tasklist?: string[];
  owner?: string;
  collaborators?: string[];
};

export const Project = {
  updateCollaborators: async (
    projectId: string,
    collaborators: string[]
  ): Promise<{ success: boolean; project: any }> => {
    const url = `${KONG_BASE_URL}/organise-project/projects/${projectId}/collaborators`;
    const { data } = await api.put<{ success: boolean; project: any }>(url, { collaborators });
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

  getById: async (projectId: string): Promise<ProjectDto> => {
    const url = `${KONG_BASE_URL}/organise-project/projects/${projectId}`;
    const { data } = await api.get<ProjectDto>(url);
    return data;
  },

  updateProject: async (projectId: string, updates: UpdateProjectRequest): Promise<{ success: boolean; project: any }> => {
    const url = `${KONG_BASE_URL}/organise-project/projects/${projectId}`;
    const { data } = await api.put<{ success: boolean; project: any }>(url, updates);
    return data;
  },

  delete: async (projectId: string): Promise<{ success: boolean; message?: string }> => {
    const url = `${KONG_BASE_URL}/organise-project/projects/${projectId}`;
    const { data } = await api.delete<{ success: boolean; message?: string }>(url);
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

  getSubTaskOfTask: async (taskId: string): Promise<Task[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/subtask/${taskId}`;
    const { data } = await api.get<Task[]>(url);
    return data;
  },

  createTask: async (newTask: Omit<Task, "id">): Promise<Task> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/new`;
    const { data } = await api.post<Task>(url, newTask);
    return data;
  },

  createTaskWithProjectData: async (taskData: TaskPostRequestDto): Promise<Task> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/new`;
    const { data } = await api.post<Task>(url, taskData);
    return data;
  },

  updateTask: async (taskId: string, updates: TaskPostRequestDto): Promise<Task> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/edit/${taskId}`;
    const { data } = await api.put<Task>(url, updates);
    return data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${taskId}`;
    await api.delete(url);
  },
};

export const Notification = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const url = `${KONG_BASE_URL}/notifications/${userId}`;
    const response = await api.get(url);
    return response.data;
  },

  markAsRead: async (ids: string[]): Promise<void> => {
    const url = `${KONG_BASE_URL}/notifications/read`;
    await api.patch(url, { ids });
  },

  getPreferences: async (userId: string): Promise<string[]> => {
    const url = `${KONG_BASE_URL}/manage-notifications/preferences/${userId}`;
    const response = await api.get(url);
    console.log(response)
    return response.data;
  },

  updatePreferences: async (userId: string, preferences: string[]): Promise<void> => {
    const validPrefs = ["in-app", "email"];
    const filteredPrefs = preferences.filter(p => validPrefs.includes(p));

    const url = `${KONG_BASE_URL}/manage-notifications/preferences/${userId}`;
    await api.post(url, filteredPrefs);
  },

  deleteNotification: async (userId: string, notifId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/notifications/${userId}/${notifId}`;
    await api.delete(url);
  },

  deleteAllNotification: async (userId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/notifications/all/${userId}`;
    await api.delete(url);
  },

  toggleReadNotification: async (notifId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/notifications/toggle/${notifId}`
    await api.patch(url)
  }
}

export default api;
