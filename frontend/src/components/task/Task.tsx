import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditTask from "./EditTask"; // Import the EditTask component

type TaskProps = {
  id: string;
  title: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
};

export const Task: React.FC<TaskProps> = ({
  id,
  title,
  description,
  status,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editing, setEditing] = useState(false); // State to toggle the EditTask modal

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Unassigned":
        return "bg-gray-100 text-gray-800";
      case "Ongoing":
        return "bg-blue-100 text-blue-800";
      case "Under Review":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`p-4 rounded relative ${getStatusColor(status)}`}>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <span className="text-xs capitalize">{status}</span>
      </div>

      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded shadow-lg z-10">
            <ul className="py-1">
              <li>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setEditing(true); // Open the EditTask modal
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit Task
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    // onDelete();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                >
                  Delete Task
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {editing && (
        <EditTask
        taskId={id}
        onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
};