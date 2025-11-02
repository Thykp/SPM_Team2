import { useEffect } from "react";

export type ToastData = {
  id: string;
  title: string;
  link: string;
  description?: string;
  bgColor?: string;
  textColor?: string;
};

type ToastProps = ToastData & {
  onClose: (id: string) => void;
  duration?: number;
};

export function Toast({ id, title, description, onClose, duration = 5000, bgColor = "#fff", textColor = "#000" }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  return (
    <div
      className="border shadow-lg rounded-md p-4 w-80 mb-2 animate-slide-in-right flex justify-between items-start"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div>
        <div className="font-semibold">{title}</div>
        {description && <div className="text-sm">{description}</div>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="ml-4 font-bold"
        style={{ color: textColor }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
