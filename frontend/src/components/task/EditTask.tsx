import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile, Task, type LiteUser } from "@/lib/api"; // Import Task type and service
import { X } from "lucide-react";
import CollaboratorPickerNewProj from "@/components/project/CollaboratorPickerNewProj";
import Select from "react-select";

interface LocalTask {
  id: string;
  title: string;
  deadline: string;
  description: string;
  status: "Unassigned" | "Ongoing" | "Under Review" | "Completed" | "Overdue";
  collaborators: string[];
  owner: string;
  ownerName?: string;
  ownerDepartment?: string;
  parent?: string | null;
  isEditingOwner?: boolean;
}

// Mock Data (to be replaced with actual API data)
const ownerOptions = [
  { value: "c0cd847d-8c61-45dd-8dda-ecffe214943e", label: "Yu Feng" },
  { value: "588fb335-9986-4c93-872e-6ef103c97f92", label: "John Doe" },
  { value: "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv", label: "Jane Smith" },
];

interface EditTaskProps {
  taskId: string; // The ID of the task to be edited
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const EditTask: React.FC<EditTaskProps> = ({ taskId, onClose }) => {
  const [task, setTask] = useState<LocalTask | null>(null); // State to store the fetched task
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<LiteUser[]>([]); // List of all users
  const [userSearchTerm, setUserSearchTerm] = useState(""); // Search term for filtering users
  const [loadingUsers, setLoadingUsers] = useState(false); // Loading state for fetching users

  // Fetch the task details when the component is mounted
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await Task.getTaskByIdWithOwner(taskId); // Use the new function
        console.log("Fetched task data:", data);
        setTask(data); // Set the fetched task

        const allUsers = await Profile.getAllUsers(); // Replace with your API call
        setUsers(allUsers);
      
      } catch (error) {
        console.error("Error fetching task:", error);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!task) {
        throw new Error("Task data is missing");
      }

      // Call the API to update the task
      const updatedTask = await Task.updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: task.status,
        deadline: task.deadline,
        collaborators: task.collaborators,
        owner: task.owner,
        parent: task.parent,
      });

      console.log("Task successfully updated:", updatedTask);

      // Close the modal after updating
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setLoading(false);
    }

  };

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Loading Task...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Edit Task</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[50vh]">
        <form onSubmit={handleUpdateTask} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
                Task Title
            </Label>
            <Input
                id="title"
                type="text"
                placeholder="Enter a descriptive task title"
                value={task.title}
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, title: e.target.value }))
                }
                className="h-11"
                required
            />
            </div>

            {/* Description */}
            <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
                Task Description
            </Label>
            <textarea
                id="description"
                placeholder="Enter a detailed description of the task"
                value={task.description}
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                required
            />
            </div>

            {/* Status */}
            <div className="space-y-2">
            <Label htmlFor="status" className="text-base font-medium">
                Task Status
            </Label>
            <select
                id="status"
                value={task.status}
                onChange={(e) =>
                setTask((prev) => ({
                    ...prev!,
                    status: e.target.value as LocalTask["status"],
                }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
                <option value="Unassigned">Unassigned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Under Review">Under Review</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
            </select>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
            <Label htmlFor="deadline" className="text-base font-medium">
                Deadline
            </Label>
            <Input
                id="deadline"
                type="datetime-local"
                value={new Date(task.deadline).toISOString().slice(0, 16)} // Convert ISO to datetime-local format
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, deadline: e.target.value }))
                }
                className="h-11"
                required
            />
            </div>

            {/* Collaborators */}
            <div className="space-y-2">
              <CollaboratorPickerNewProj
                users={users} // List of all users
                userSearchTerm={userSearchTerm} // Current search term
                onUserSearchChange={setUserSearchTerm} // Callback to update the search term
                selectedCollaborators={task.collaborators} // List of selected collaborator IDs
                onToggleCollaborator={(userId) => {
                  setTask((prev) => ({
                    ...prev!,
                    collaborators: prev!.collaborators.includes(userId)
                      ? prev!.collaborators.filter((id) => id !== userId)
                      : [...prev!.collaborators, userId],
                  }));
                }} // Callback to toggle collaborator selection
                loadingUsers={loadingUsers} // Boolean indicating if users are being loaded
                currentUserId={task.owner} // Pass the current user ID if needed
              />
            </div>

            {/* Owner */}
            {/* <div className="space-y-2">
            <Label htmlFor="owner" className="text-base font-medium">
                Owner
            </Label>
            <Input
                id="owner"
                type="text"
                placeholder="Enter the owner ID"
                value={task.ownerName + " (" + task.ownerDepartment + ")" || ""}
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, ownerName: e.target.value }))
                }
                className="h-11"
                required
            />
            </div> */}

            {/* Owner Dropdown Mock*/}
            {/* <Select
              options={ownerOptions}
              value={ownerOptions.find((option) => option.value === task.owner) || null}
              onChange={(selectedOption) =>
                setTask((prev) => ({
                  ...prev!,
                  owner: selectedOption?.value || "",
                  ownerName: selectedOption?.label || "",
                }))
              }
              placeholder="Select an owner"
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  height: "44px", // Adjust height
                  borderColor: "gray",
                  boxShadow: "none",
                  "&:hover": { borderColor: "black" },
                }),
              }}
            /> */}

            {/* Owner Field with Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-base font-medium">
                Owner
              </Label>
              {task.isEditingOwner ? (
                // Show the dropdown when in editing mode
                <Select
                  options={ownerOptions}
                  value={ownerOptions.find((option) => option.value === task.owner) || null}
                  onChange={(selectedOption) => {
                    setTask((prev) => ({
                      ...prev!,
                      owner: selectedOption?.value || "",
                      ownerName: selectedOption?.label || "",
                      isEditingOwner: false, // Exit editing mode after selection
                    }));
                  }}
                  placeholder="Select an owner"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      height: "44px",
                      borderColor: "gray",
                      boxShadow: "none",
                      "&:hover": { borderColor: "black" },
                    }),
                  }}
                />
              ) : (
                // Show the plain text when not in editing mode
                <div
                  className="cursor-pointer"
                  onClick={() => setTask((prev) => ({ ...prev!, isEditingOwner: true }))}
                >
                  <span>
                    {task.ownerName} {task.ownerDepartment ? `(${task.ownerDepartment})` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Parent Task */}
            {/* <div className="space-y-2">
            <Label htmlFor="parent" className="text-base font-medium">
                Parent Task
            </Label>
            <Input
                id="parent"
                type="text"
                placeholder="Enter the parent task ID (optional)"
                value={task.parent || ""} // Handle null values
                onChange={(e) =>
                setTask((prev) => ({ ...prev!, parent: e.target.value || null }))
                }
                className="h-11"
            />
            </div> */}
            {/* Buttons */}
            <div className="flex gap-3 pt-6">
            <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11"
            >
                Cancel
            </Button>
            <Button
                type="submit"
                className="flex-1 h-11"
                disabled={!task.title.trim()}
            >
                {loading ? "Updating..." : "Update Task"}
            </Button>
            </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTask;