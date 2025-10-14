import { useState, useCallback } from "react";
import { Toast } from "./toast";

export type ToastData = {
  id: string;
  title: string;
  description?: string;
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [toast, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>

      {typeof window !== "undefined" && (window as any).addToast === undefined && ((window as any).addToast = addToast)}
    </>
  );
}
