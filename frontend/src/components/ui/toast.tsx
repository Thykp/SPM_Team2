import { useEffect } from "react";

type ToastProps = {
  id: string;
  title: string;
  description?: string;
  onClose: (id: string) => void;
  duration?: number;
};

export function Toast({ id, title, description, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  return (
    <div className="bg-white border shadow-lg rounded-md p-4 w-80 mb-2 animate-slide-in-right flex justify-between items-start">
      <div>
        <div className="font-semibold">{title}</div>
        {description && <div className="text-sm text-gray-600">{description}</div>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-4 text-gray-400 hover:text-gray-700"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
