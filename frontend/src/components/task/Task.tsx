import React, { useState } from "react";
import { MoreHorizontal, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EditTask from "./EditTask"; // Import the EditTask component
import { TaskApi, type TaskDTO as apiTask } from "@/lib/api";
import { TaskDetailNavigator } from "@/components/task/TaskDetailNavigator";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { RecurTask } from "./RecurTask";
 

type TaskProps = {
  taskContent: apiTask;
  onTaskDeleted?: (taskId: string) => void;
};

export const Task: React.FC<TaskProps> = ({
  taskContent,
  onTaskDeleted,
}) => {
  const { profile } = useAuth(); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editing, setEditing] = useState(false); // State to toggle the EditTask modal
  const [recurring, setRecurring] = useState(false); // State to toggle the RecurTask modal
  const [showDetails, setShowDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    const deleteTask = async () => {
      try {
        setDeleting(true); // Set deleting state to true
        await TaskApi.deleteTask(taskContent.id); // Call the deleteTask API
        console.log(`Task ${taskContent.id} deleted successfully`);
        if (onTaskDeleted) {
          onTaskDeleted(taskContent.id); // Notify the parent component
        }
      } catch (error) {
        console.error("Failed to delete task:", error);
        alert("Failed to delete task. Please try again.");
      } finally {
        setDeleting(false); // Reset deleting state
      }
    };

  return (
    <div className={`p-4 rounded relative ${getStatusColor(taskContent.status)}`}>
      <div 
        className="cursor-pointer pr-2 pb-2"
        onClick={() => setShowDetails(true)}
      >
        <h3 className="text-lg font-bold">{taskContent.title}</h3>
        <p className="text-sm text-gray-600">{taskContent.description}</p>
        
        {/* Bottom row with status and priority */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs capitalize">{taskContent.status}</span>
          
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium",
              (taskContent.priority ?? 0) >= 8 ? "border-red-500 text-red-700 bg-red-50" :
              (taskContent.priority ?? 0) >= 4 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
              "border-green-500 text-green-700 bg-green-50"
            )}
          >
            <Gauge className="h-3 w-3 mr-1" />
            {taskContent.priority ?? "N/A"}
          </Badge>
        </div>
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
                    setRecurring(true); // Open the RecurTask modal
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Recur Task
                </button>
              </li>
              <li>
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    await deleteTask(); // Call the deleteTask function
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
                  disabled={deleting} // Disable button while deleting
                >
                  {deleting ? "Deleting..." : "Delete Task"}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {editing && (
        <EditTask
        taskId={taskContent.id}
        currentUserId={profile?.id || ""}
        onClose={() => setEditing(false)}
        />
      )}

      {recurring && (
        <RecurTask
          taskId={taskContent.id}
          onClose={() => setRecurring(false)}
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