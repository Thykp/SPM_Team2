export type Notification = {
  id: string;
  notif_text: string;
  notif_type: string;
  from_user: string;
  from_username?: string;
  to_user: string;
  created_at?: string;
  resource_type?: string;
  resource_id?: string;
  project_id?: string;
  priority?: number;
  read: boolean;
};