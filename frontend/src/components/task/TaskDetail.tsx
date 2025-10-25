import { useEffect, useState } from "react";
import { type TaskDTO as taskType, TaskApi as taskAPI, Profile as profileAPI } from "@/lib/api";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { User, Calendar, Users, ChevronLeft, ChevronRight, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Edit, Trash2 } from "lucide-react";
import EditTask from "./EditTask";
import CreateSubtask from "./CreateSubtask";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


type TaskDetailProps = {
    currentTask: taskType;
    isOpen: boolean;
    onClose: () => void;

    parentTask?: taskType;
    onNavigateToSubTask?: (subTask: taskType) => void;
    onNavigateBack?: () => void;
}

export function TaskDetail({currentTask, isOpen, onClose, parentTask, onNavigateToSubTask, onNavigateBack}: TaskDetailProps){
    const { user } = useAuth();
    const [subTasks, setSubTasks] = useState<taskType[]>([]);
    const [loading, setLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
    const [showAddSubtaskDialog, setShowAddSubtaskDialog] = useState(false);
    const [editingSubtask, setEditingSubtask] = useState<taskType | null>(null);
    const [deletingSubtask, setDeletingSubtask] = useState<taskType | null>(null);

    // Helper function to display user name or "You"
    const getDisplayName = (userId: string): string => {
        if (user?.id === userId) {
            return "You";
        }
        return userProfiles[userId]?.display_name || userId;
    };

    const handleDeleteSubtask = async () => {
      if (!deletingSubtask) return;

      try {
        await taskAPI.deleteTask(deletingSubtask.id); // Call the delete API
        console.log(`Subtask ${deletingSubtask.id} deleted successfully`);
        setSubTasks((prev) => prev.filter((task) => task.id !== deletingSubtask.id)); // Remove the deleted subtask from the list
        setDeletingSubtask(null); // Close the delete confirmation dialog
      } catch (error) {
        console.error("Failed to delete subtask:", error);
        alert("Failed to delete subtask. Please try again.");
      }
    };

    useEffect(() => {
        if (isOpen && currentTask){
          if (!parentTask){
            getSubTasks();
          }
          getUserProfiles();
        }
    },
    [isOpen, currentTask, parentTask]
    );

    const getSubTasks = async() => {
        setLoading(true);
        try {
            const subTasks = await taskAPI.getSubTaskOfTask(currentTask.id);
            setSubTasks(subTasks);
        } catch (error) {
            console.error("Error fetching subtasks:", error);
        } finally {
            setLoading(false);
        }
    }

    const getUserProfiles = async() => {
        setUserLoading(true);
        try {
            // Fetch all users to get a complete mapping of user ID to profile
            const allUsers = await profileAPI.getAllUsers();
            
            // Create a mapping of user ID to user data for easy lookup
            const profileMap: {[key: string]: any} = {};
            allUsers.forEach((user) => {
                profileMap[user.id] = user;
            });
            
            setUserProfiles(profileMap);
        } catch (error) {
            console.error("Error fetching user profiles:", error);
        } finally {
            setUserLoading(false);
        }
    }

    const formatDate = (dateString: string) =>{
        const taskDueDate = new Date(dateString);
        const formattedDate = taskDueDate.toLocaleDateString(undefined,{
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        return formattedDate;
    }

    const formatToLocalDatetime = (dateString: string) => {
        const date = new Date(dateString);
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16).replace('T', ' ');
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "Completed":
                return "default";
            case "Ongoing":
                return "secondary";
            case "Under Review":
                return "outline";
            case "Overdue":
                return "destructive";
            default:
                return "outline";
        }
    }

    if (!isOpen) {
        return null;
    }

    return(
      <Sheet 
        open={true} 
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        modal={true}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-6">
            {/* Breadcrumb Navigation */}
            {parentTask && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <ChevronLeft className="h-4 w-4" />
                <span className="hover:text-foreground cursor-pointer" onClick={onNavigateBack}>
                  {parentTask.title}
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{currentTask.title}</span>
              </div>
            )}
            <SheetTitle className="text-xl font-semibold">
              {currentTask.title}
            </SheetTitle>
          </SheetHeader>
        
          {currentTask ? (
            <div className="space-y-6 px-4">
              {/* Status and Priority Badge Section */}
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(currentTask.status)} className="text-xs font-medium">
                  {currentTask.status}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-medium",
                    (currentTask.priority ?? 0) >= 8 ? "border-red-500 text-red-700 bg-red-50" :
                    (currentTask.priority ?? 0) >= 4 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                    "border-green-500 text-green-700 bg-green-50"
                  )}
                >
                  <Gauge className="h-3 w-3 mr-1" />
                  Priority {currentTask.priority ?? "N/A"}
                </Badge>
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentTask.description}
                </p>
              </div>

              <Separator />

              {/* Task Metadata Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Task Information</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Owner</p>
                      {userLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {currentTask.owner && getDisplayName(currentTask.owner) === "You" ? (
                            <span className="font-bold">You</span>
                          ) : (
                            currentTask.owner ? getDisplayName(currentTask.owner) : "No owner assigned"
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Deadline</p>
                      <p className="text-sm text-muted-foreground">
                        {formatToLocalDatetime(currentTask.deadline)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Collaborators</p>
                      {userLoading ? (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-muted-foreground"></div>
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        </div>
                      ) : (() => {
                        // Filter out the owner and any null/undefined values
                        const filteredCollaborators = (currentTask.collaborators || [])
                          .filter(collaborator => collaborator && collaborator !== currentTask.owner);
                        
                        return filteredCollaborators.length > 0 ? (
                          <div className="space-y-1 mt-1">
                            {filteredCollaborators.map((collaborator, index) => (
                              <p key={index} className="text-sm text-muted-foreground">
                                {getDisplayName(collaborator) === "You" ? (
                                  <span className="font-bold">You</span>
                                ) : (
                                  getDisplayName(collaborator)
                                )}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No collaborators assigned</p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Only show Subtasks section if current task is not a subtask */}
              {!parentTask && (
                <>
                  <Separator />
              {/* Subtasks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ">
                  <div className="flex gap-2">
                  <h4 className="text-lg font-semibold">Subtasks</h4>
                  <Badge variant="outline" className="text-xs">
                    {subTasks.length} {subTasks.length === 1 ? 'task' : 'tasks'}
                  </Badge>
                  </div>
                  {/* Add Subtask Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddSubtaskDialog(true)} // Open the Add Subtask modal
                  >
                    + Add Subtask
                  </Button>
                </div>
                
                <div className="max-h-[40vh] overflow-y-auto">
                  {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading subtasks...</p>
                    </div>
                  </div>
                ) : subTasks.length > 0 ? (
                  <div className="space-y-3">
                    {subTasks.map((subTask) => (
                      <Card key={subTask.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onNavigateToSubTask?.(subTask)}
                      >
                        <div className="space-y-3">
                          {/* Title Row with Icons */}
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm">{subTask.title}</h5>
                            <div className="flex items-center gap-2">
                              {/* Edit Button */}
                              <button
                                type="button"
                                className="p-2 rounded-full hover:bg-primary/20 hover:scale-110 transition-transform transition-colors"
                                aria-label="Edit Subtask"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click event
                                  setEditingSubtask(subTask); // Open the edit modal
                                }}
                              >
                                <Edit className="h-4 w-4 text-primary" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                className="p-2 rounded-full hover:bg-destructive/20 hover:scale-110 transition-transform transition-colors"
                                aria-label="Delete Subtask"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click event
                                  setDeletingSubtask(subTask); // Open the delete confirmation dialog
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">{subTask.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant={getStatusBadgeVariant(subTask.status)} className="text-xs">
                              {subTask.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Due {formatDate(subTask.deadline)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="space-y-2">
                      <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No subtasks found</p>
                    </div>
                  </div>
                )}
                </div>
              </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">Failed to load task details</p>
              </div>
            </div>
          )}

          {/* Add Subtask Modal */}
          {showAddSubtaskDialog && (
            <CreateSubtask
              parentTaskId={currentTask.id} // Pass the current task ID as the parentTaskId
              projectId={currentTask.project_id || ""} // Pass the project ID
              onSubtaskCreated={(newSubtask) => {
                console.log("Subtask created:", newSubtask);
                setShowAddSubtaskDialog(false); // Close the modal after creating the subtask
                getSubTasks(); // Refresh the subtasks list
              }}
              open={showAddSubtaskDialog}
              onOpenChange={setShowAddSubtaskDialog}
              currentUserId={user?.id || ""}
            />
          )}

          {/* Edit Subtask Modal */}
          {editingSubtask && (
            <EditTask
              taskId={editingSubtask.id}
              currentUserId={user?.id || ""}
              onClose={() => setEditingSubtask(null)} // Close the edit modal
              onTaskUpdated={() => {
                setEditingSubtask(null); // Close the modal
                getSubTasks(); // Refresh the subtasks list
              }}
            />
          )}

          {/* Delete Confirmation Dialog */}
          {deletingSubtask && (
            <Dialog open={true} onOpenChange={() => setDeletingSubtask(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Subtask</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to delete this subtask?</p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeletingSubtask(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSubtask}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

        </SheetContent>
      </Sheet>    
    )

}

