import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification } from "@/lib/api";

type FrequencyPrefs = {
  delivery_frequency: string;
  delivery_time: string;
  delivery_day: string;
};

type NotificationContextType = {
  deliveryPreferences: string[] | null;
  frequencyPreferences: FrequencyPrefs | null;
  notificationLoading: boolean;
  refreshPreferences: (userId: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) => {
  const [deliveryPreferences, setDeliveryPreferences] = useState<string[] | null>(null);
  const [frequencyPreferences, setFrequencyPreferences] = useState<FrequencyPrefs | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const fetchPreferences = async (uid: string) => {
    try {
      setNotificationLoading(true);

      const [delivery, frequency] = await Promise.all([
        Notification.getDeliveryPreferences(uid),
        Notification.getFrequencyPreferences(uid),
      ]);

      setDeliveryPreferences(delivery);
      setFrequencyPreferences(frequency);
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchPreferences(userId);
  }, [userId]);

  const refreshPreferences = async (uid: string) => {
    await fetchPreferences(uid);
  };

  return (
    <NotificationContext.Provider
      value={{
        deliveryPreferences,
        frequencyPreferences,
        notificationLoading,
        refreshPreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
};
