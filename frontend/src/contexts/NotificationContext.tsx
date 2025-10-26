import React, { createContext, useContext, useState, useEffect } from "react";
import { Notification } from "@/lib/api";
import { useAuth } from "../contexts/AuthContext";

type FrequencyPrefs = {
  delivery_frequency: string;
  delivery_time: string;
  delivery_day: string;
};

type NotificationContextType = {
  deliveryPreferences: { email: string; delivery_method: string[] };
  frequencyPreferences: FrequencyPrefs | null;
  notificationLoading: boolean;
  refreshPreferences: () => Promise<void>
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [deliveryPreferences, setDeliveryPreferences] = useState<{ email: string; delivery_method: string[] }>({
    email: "",
    delivery_method: [],
  });

  const [frequencyPreferences, setFrequencyPreferences] = useState<FrequencyPrefs | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const fetchPreferences = async () => {
    if (!userId) return;

    try {
      setNotificationLoading(true);

      const [delivery, frequency] = await Promise.all([
        Notification.getDeliveryPreferences(userId),
        Notification.getFrequencyPreferences(userId),
      ]);

      setDeliveryPreferences({
        email: delivery?.email ?? "",
        delivery_method: delivery?.delivery_method ?? [],
      });

      setFrequencyPreferences(frequency);

      console.info("Delivery preferences fetched:", delivery);
      console.info("Frequency preferences:", frequency);
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
      setDeliveryPreferences({ email: "", delivery_method: [] });
      setFrequencyPreferences(null);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    void fetchPreferences();
  }, [userId]); // refetch whenever user changes

  const refreshPreferences = async () => {
    await fetchPreferences();
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
