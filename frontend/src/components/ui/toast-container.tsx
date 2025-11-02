import { useState, useCallback, useEffect } from "react";
import { Toast } from "./toast";
import type { ToastData } from "./toast";

const MAX_VISIBLE = 2;

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [queue, setQueue] = useState<ToastData[]>([]);
  const [showAll, setShowAll] = useState(false);

  const addToast = useCallback((toast: ToastData) => {
    setToasts(prev => {
      setQueue(q => {
        const isDuplicate =
          prev.some(t => t.title === toast.title && t.description === toast.description) ||
          q.some(t => t.title === toast.title && t.description === toast.description);
        if (isDuplicate) return q;
        if (prev.length < MAX_VISIBLE) return q;
        return [...q, toast];
      });

      const isDuplicate = prev.some(t => t.title === toast.title && t.description === toast.description);
      if (isDuplicate) return prev;

      if (prev.length < MAX_VISIBLE) return [toast, ...prev];
      return prev;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    setQueue(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).addToast) {
      (window as any).addToast = addToast;
    }
  }, [addToast]);

  const visibleToasts = showAll ? [...toasts, ...queue] : toasts;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end z-50 space-y-2">
      {visibleToasts.map(t => (
        <Toast key={t.id} {...t} onClose={removeToast} />
      ))}

      {!showAll && queue.length > 0 && (
        <div
          className="border shadow-lg rounded-md p-2 w-80 text-center bg-gray-200 text-gray-700 font-medium cursor-pointer"
          onClick={() => setShowAll(true)}
        >
          +{queue.length} more
        </div>
      )}
    </div>
  );
}
