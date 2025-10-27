import { useAuth } from "@/contexts/AuthContext";
import { NotificationDelivery } from "../../components/notifications/NotificationDelivery";
import { NotificationFrequency } from "../../components/notifications/notificationFrequency";

export function Settings() {
  const { profile, authLoading } = useAuth();

  if (authLoading) return <p>Loading...</p>;
  if (!profile) return <p>User not found.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Notification Settings</h1>
      <p className="text-gray-400 text-sm">Customize your notification settings here</p>
      <hr className="mb-2" />
      <NotificationDelivery userId={profile.id} />
      <NotificationFrequency userId={profile.id} />
    </div>
  );
}
