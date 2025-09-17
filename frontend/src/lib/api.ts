export const PROFILE_API = import.meta.env.VITE_PROFILE_API as string; // http://localhost:3030
export const PROJECT_API = import.meta.env.VITE_PROJECT_API as string; // http://localhost:3040

export type LiteUser = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

export async function fetchAllUsers(): Promise<LiteUser[]> {
  if (!PROFILE_API) throw new Error("VITE_PROFILE_API is not set");
  const res = await fetch(`${PROFILE_API}/user/all`, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`);
  return res.json();
}

export async function putProjectCollaborators(projectId: string, collaborators: string[]) {
  if (!PROJECT_API) throw new Error("VITE_PROJECT_API is not set");
  const res = await fetch(`${PROJECT_API}/project/${projectId}/collaborators`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ collaborators }),
  });
  if (!res.ok) throw new Error(`Failed to update collaborators (${res.status})`);
  return res.json() as Promise<{ success: boolean; project: any }>;
}
