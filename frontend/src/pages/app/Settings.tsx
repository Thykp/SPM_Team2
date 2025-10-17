import { NotificationPreferences } from "@/components/notifications/notificationsSettings";
import { NotificationFrequency } from "@/components/notifications/notificationFrequency";
import { useAuth } from "@/contexts/AuthContext";

export function Settings() {
  const { profile, authLoading } = useAuth();

  if (authLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notification Settings</h1>
      <p className="text-gray-400 text-sm">
        Customise your notification settings here
      </p>
      <hr className="mb-4" />

      {profile ? (
        <div className="space-y-4">
          <NotificationPreferences userId={profile.id} />
          <NotificationFrequency userId={profile.id} />
        </div>
      ) : (
        <p>User not found.</p>
      )}
    </div>
  );
}
