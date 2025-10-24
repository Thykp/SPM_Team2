import { useState, useCallback, useEffect } from "react";
import { Toast } from "./toast";
import type { ToastData } from "./toast";

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showAll, setShowAll] = useState(false);

  const addToast = useCallback((toast: ToastData) => {
    setToasts(prev => [toast, ...prev]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).addToast) {
      (window as any).addToast = addToast;
    }
  }, [addToast]);

  // Determine visible toasts
  const visibleToasts = showAll ? toasts : toasts.slice(0, 2);
  const hiddenCount = toasts.length - 2;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
      {visibleToasts.map(t => (
        <Toast key={t.id} {...t} onClose={removeToast} />
      ))}

      {!showAll && hiddenCount > 0 && (
        <div
          className="border shadow-lg rounded-md p-2 w-80 text-center bg-gray-200 text-gray-700 font-medium cursor-pointer"
          onClick={() => setShowAll(true)}
        >
          +{hiddenCount} more
        </div>
      )}
    </div>
  );
}
