import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditTask from "./EditTask"; // Import the EditTask component
import type { TaskDTO as apiTask } from "@/lib/api";
import { TaskDetailNavigator } from "@/components/task/TaskDetailNavigator";
import { TaskReminder } from "./TaskReminder";
 

type TaskProps = {
  taskContent: apiTask;
};

export const Task: React.FC<TaskProps> = ({
  taskContent
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editing, setEditing] = useState(false); // State to toggle the EditTask modal
  const [showDetails, setShowDetails] = useState(false);

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
    <div className={`p-4 rounded relative ${getStatusColor(taskContent.status)}`}>
      <div 
        className="cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <h3 className="text-lg font-bold">{taskContent.title}</h3>
        <p className="text-sm text-gray-600">{taskContent.description}</p>
        <span className="text-xs capitalize">{taskContent.status}</span>
      </div>

      <div className="absolute top-2 right-2 flex items-center space-x-2">
        <TaskReminder taskId={taskContent.id} status={taskContent.status} />

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
        taskId={taskContent.id}
        onClose={() => setEditing(false)}
        />
      )}

      <TaskDetailNavigator
        initialTask ={taskContent}
        isOpen = {showDetails}
        onClose = {() => setShowDetails(false)}
      />

    </div>
  );
};