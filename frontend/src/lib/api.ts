import axios from "axios";

const KONG_BASE_URL = import.meta.env.VITE_KONG_BASE_URL || "http://localhost:8000";
const PROFILE_API   = import.meta.env.VITE_PROFILE_API   || `${KONG_BASE_URL}/profile`;
const TASK_API      = import.meta.env.VITE_TASK_API      || `${KONG_BASE_URL}/task`;
const GENERATE_REPORT_API = import.meta.env.VITE_REPORT_API || `${KONG_BASE_URL}/generate-report`;

const api = axios.create({
  baseURL: KONG_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ----- Types -----
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
  owner_id?: string | null;       // returned by /task/users (backend aggregation)
  participants?: string[] | null; // returned by /task/users (backend aggregation)
};
 
// Task payload for create/update (atomic service)
export type TaskPostRequestDto = {
  title: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  owner: string | null;
  collaborators: string[];
  deadline: string;
  project_id?: string | null;
  parent?: string | null;
  priority: number; // 1-10
};

// Canonical Task shape returned by most endpoints
export type TaskDTO = {
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

export type TaskDeadlineReminder = {
  id: string;
  deadline_reminder: []
}


export type ProjectDto = {
  id: string;
  createdat?: string | null;
  created_at?: string | null; // should standardise to either createdat or created_at later
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
  ownerId: string; // Changed from "owner" to match backend @JsonProperty
  collaborators?: string[];
};

export type Profile = {
  department: string;
  role: string;
  display_name?: string;
  teams?: string[];
};

export type ProfileRequestDetailsDto = {
  id: string;
};

export type Notification = {
  
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

type GetAllUsersRaw = {
  id: string;
  display_name: string;
  role: string | null;
  department: { name: string } | string | null; // Updated to include object type
  department_id?: string | null;
  team_id?: string | null;
  team: { name: string } | string | null; // Updated to include object type
};

/** Normalized shape we expose to the app (note: department is string, not null) */
export type GetAllUsers = {
  id: string;
  display_name: string;
  role: string;
  department: string;
  department_id?: string | null;
  team_id?: string | null;
  team: string | null;
};

export type UpdateProjectRequest = {
  title?: string;
  description?: string;
  tasklist?: string[];
  owner?: string;
  collaborators?: string[];
};



// ----- Services -----
export const Profile = {
  getAllUsers: async (): Promise<GetAllUsers[]> => {
    const url = `${KONG_BASE_URL}/profile/user/all`;
    const { data } = await api.get<GetAllUsersRaw[]>(url);

    const normalized: GetAllUsers[] = (Array.isArray(data) ? data : []).map((u) => ({
      id: u.id,
      display_name: u.display_name,
      role: u.role ?? "Staff",
      department: typeof u.department === "object" ? u.department?.name ?? "" : u.department ?? "",
      department_id: u.department_id ?? null,
      team_id: u.team_id ?? null,
      team: typeof u.team === "object" ? u.team?.name ?? "" : u.team ?? null,
    }));

    return normalized;
  },

  getProfileDetailsWithId: async (listOfUserIds: ProfileRequestDetailsDto[]): Promise<Profile[]> => {
    const url = `${KONG_BASE_URL}/manage-account/api/users/getUserDetails`;
    const { data } = await api.post<Profile[]>(url, listOfUserIds);
    return data;
  },

  getAllTeams: async (): Promise<{ data: { id: string; name: string; department_id: string }[] }> => {
    const url = `${KONG_BASE_URL}/manage-account/api/users/teams`; // Call the manage-account composite service
    const response = await api.get<{ data: { id: string; name: string; department_id: string }[] }>(url);
    return response.data; // Return the full response object
  },

  getAllDepartments: async (): Promise<{ data: { id: string; name: string }[] }> => {
    const url = `${KONG_BASE_URL}/manage-account/api/users/departments`; // Call the manage-account composite service
    const response = await api.get<{ data: { id: string; name: string }[] }>(url);
    return response.data; // Return the full response object
  },
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

  createTask: async (newTask: TaskPostRequestDto): Promise<TaskDTO> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/new`;
    const { data } = await api.post<TaskDTO>(url, newTask);
    return data;
  },

  updateTask: async (taskId: string, updates: TaskPostRequestDto): Promise<TaskDTO> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/edit/${taskId}`;
    const { data } = await api.put<TaskDTO>(url, updates);
    return data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/${taskId}`;
    await api.delete(url);
  },

  getDeadlineReminder: async (taskId: string, userId: string): Promise<TaskDeadlineReminder> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/reminder/${taskId}/${userId}`;
    const { data } = await api.get<TaskDeadlineReminder>(url);
    return data
  },

  setDeadlineReminder: async (taskId: string, userId: string, reminders: number[]): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-task/api/task/reminder/${taskId}/${userId}`;
    await api.post(url, {deadline_reminder: reminders});
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
  url.searchParams.set("role", params.role ?? "Staff");

  const { data } = await api.get<Staff[]>(url.toString());
  return data;
}

// Fetch tasks for many users (owner or collaborator via revamped_task_participant)
export async function fetchTasksByUsers(ids: string[]): Promise<TaskRow[]> {
  const url = `${TASK_API}/task/users`;
  const { data } = await api.post<TaskRow[]>(url, { ids });
  return data;
}

export type GenerateReportBody = {
  startDate: string;
  endDate: string;
};

export const Report = {

  generate: async (
    userId: string,
    body: GenerateReportBody
  ): Promise<{ jobId?: string; message?: string; url?: string }> => {
    const url = `${GENERATE_REPORT_API}/${userId}`;
    const { data } = await api.post(url, body);
    return data;
  },

  generateTeam: async (
    teamId: string,
    body: GenerateReportBody
  ): Promise<{ jobId?: string; message?: string; url?: string }> => {
    const url = `${GENERATE_REPORT_API}/team/${teamId}`;
    const { data } = await api.post(url, body);
    return data;
  },

  generateDepartment: async (
    departmentId: string,
    body: GenerateReportBody
  ): Promise<{ jobId?: string; message?: string; url?: string }> => {
    const url = `${GENERATE_REPORT_API}/department/${departmentId}`;
    const { data } = await api.post(url, body);
    return data;
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

  getDeliveryPreferences: async (userId: string): Promise<{ email: string; delivery_method: string[] }> => {
    const url = `${KONG_BASE_URL}/manage-notifications/preferences/delivery/${userId}`;
    const response = await api.get(url);
    console.log("Delivery response:");
    return response.data.preferences;
  },

  updateDeliveryPreferences: async (userId: string, preferences: string[]): Promise<void> => {
    const validPrefs = ["in-app", "email"];
    const filteredPrefs = preferences.filter(p => validPrefs.includes(p));

    const url = `${KONG_BASE_URL}/manage-notifications/preferences/delivery/${userId}`;
    await api.post(url, filteredPrefs);
  },

  getFrequencyPreferences: async (userId: string): Promise<{
    delivery_frequency: string;
    delivery_time: string;
    delivery_day: string;
  }> => {
    const url = `${KONG_BASE_URL}/manage-notifications/preferences/frequency/${userId}`;
    const response = await api.get(url);
    return response.data.data; 
  },

  updateFrequencyPreferences: async (
    userId: string,
    payload: {
      delivery_frequency: string;
      delivery_time?: string | "00:00"; 
      delivery_day?: string | null;
    }
  ): Promise<{
    delivery_frequency: string;
    delivery_time: string;
    delivery_day: string;
  }> => {
    const url = `${KONG_BASE_URL}/manage-notifications/preferences/frequency/${userId}`;
    const response = await api.post(url, payload);
    return response.data.data;
  },

  publishDeadlineReminder: async ({taskId, userId, deadline,reminderDays, username,}: { taskId: string; userId: string; deadline: string; reminderDays: number[]; username: string;}): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-notifications/publish/deadline-reminder`;

    const payload = { taskId, userId, reminderDays, deadline, username};

    await api.post(url, payload);
  },

  publishAddedToResource: async ({ resourceType, resourceId, resourceContent, collaboratorIds, addedBy}:{ resourceType: string; resourceId: string; resourceContent: Record<string, any>, collaboratorIds: string[], addedBy: string}): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-notifications/publish/added-to-resource`;

    const payload = { resourceType, resourceId, collaboratorIds, resourceContent, addedBy };
    try {
    await api.post(url, payload);
  } catch (err: unknown) {
    console.error("Failed to publish 'added to resource' notification:", err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "Unknown error occurred while publishing added-to-resource notification"
    );
  }
  },

  publishUpdate: async ({ updateType, resourceId, resourceType, resourceContent, collaboratorIds, updatedBy
  }: {updateType: "Assigned" | "Edited"; resourceId: string; resourceType: "project" | "task"; resourceContent: Record<string, any>; collaboratorIds: string[]; updatedBy: string;}): Promise<void> => {
    const url = `${KONG_BASE_URL}/manage-notifications/publish/update`;
    const payload = {updateType, resourceId, resourceType, resourceContent, collaboratorIds, updatedBy };
    
    try {
      await api.post(url, payload);
    } catch (err: unknown) {
      console.error("Failed to publish 'update' notification:", err);
      throw new Error(
        err instanceof Error
          ? err.message
          : "Unknown error occurred while publishing update notification"
      );
    }
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
  },
}

export default api;