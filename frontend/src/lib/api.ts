import axios from "axios";

const KONG_BASE_URL = import.meta.env.VITE_KONG_BASE_URL || "http://localhost:8000";
const PROFILE_API = import.meta.env.VITE_PROFILE_API || `${KONG_BASE_URL}/profile`;
const TASK_API    = import.meta.env.VITE_TASK_API    || `${KONG_BASE_URL}/task`;

const api = axios.create({
  baseURL: KONG_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

// ----- Types -----
// Staff & Task fetchers for Manager View
export type Staff = {
  id: string;
  display_name: string | null;
  role: string | null;
  team_id: string | null;
  department_id: string | null;
};

export type TaskRow = {
  id: string;
  title: string | null;
  deadline: string | null;
  status?: string | null;
  project_id?: string | null;
  description?: string | null;
  owner_id?: string | null;
  participants?: string[] | null;
};

export type TaskDTO = {
  id: string;
  title: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  owner: string;
  collaborators: string[];
  deadline: string;
  parent?: string | null;
};

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

export type Profile = {
  department: string;
  role: string;
  display_name?: string;
  teams?: string[];
};

export type ProfileRequestDetailsDto = {
  id:string;
}

// --- Task participants ---
export type TaskParticipant = { profile_id: string; is_owner: boolean };

export async function getTaskWithParticipants(
  taskId: string
): Promise<{ id: string; participants?: TaskParticipant[] } & Record<string, any>> {
  const res = await fetch(`${TASK_API}/${taskId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`getTaskWithParticipants failed: ${res.status}`);
  return res.json();
}

export async function updateTaskParticipants(
  taskId: string,
  participants: TaskParticipant[]
): Promise<{ message: string }> {
  const res = await fetch(`${TASK_API}/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ participants }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`updateTaskParticipants failed: ${res.status} ${txt}`);
  }
  return res.json();
}

// ----- Services -----
export const Profile = {
  getAllUsers: async (): Promise<Array<{ id: string; display_name: string; role: string; department: string }>> => {
    const url = `${KONG_BASE_URL}/profile/user/all`;
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
};

export const TaskApi = {
  getAllTask: async (): Promise<TaskDTO[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/`;
    const { data } = await api.get<TaskDTO[]>(url);
    return data;
  },

  getTasksByUserId: async (userId: string): Promise<TaskDTO[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${userId}`;
    const { data } = await api.get<TaskDTO[]>(url);
    return data;
  },

  getTasksById: async (taskId: string): Promise<TaskDTO> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/id/${taskId}`;
    const { data } = await api.get<TaskDTO>(url);
    return data;
  },

  getTaskByIdWithOwner: async (taskId: string): Promise<TaskDTO & { ownerName: string; ownerDepartment: string }> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/id/${taskId}`;
    const { data } = await api.get<TaskDTO & { ownerName: string; ownerDepartment: string }>(url);
    return data;
  },

  getSubTaskOfTask: async (taskId: string): Promise<TaskDTO[]> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/subtask/${taskId}`;
    const { data } = await api.get<TaskDTO[]>(url);
    return data;
  },

  createTask: async (newTask: Omit<TaskDTO, "id">): Promise<TaskDTO> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task`;
    const { data } = await api.post<TaskDTO>(url, newTask);
    return data;
  },

  updateTask: async (taskId: string, updates: Partial<TaskDTO>): Promise<TaskDTO> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/edit/${taskId}`;
    const { data } = await api.put<TaskDTO>(url, updates);
    return data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${taskId}`;
    await api.delete(url);
  },
};

// Fetch staff under scope (team or department)
export async function fetchStaffByScope(params: {
  team_id?: string;
  department_id?: string;
  role?: string; // default 'staff'
}): Promise<Staff[]> {
  const url = new URL(`${PROFILE_API}/user/staff`);
  if (params.team_id) url.searchParams.set("team_id", params.team_id);
  if (params.department_id) url.searchParams.set("department_id", params.department_id);
  url.searchParams.set("role", params.role ?? "staff");

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`fetchStaffByScope failed: ${res.status}`);
  return res.json();
}

// Fetch tasks for many users (owner or collaborator via revamped_task_participant)
export async function fetchTasksByUsers(ids: string[]): Promise<TaskRow[]> {
  const res = await fetch(`${TASK_API}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`fetchTasksByUsers failed: ${res.status}`);
  return res.json();
}

export default api;
