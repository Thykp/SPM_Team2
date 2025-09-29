import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Inline user type (replaces LiteUser)
type UserRow = {
  id: string;
  display_name: string;
  role: string;
  department: string;
};

interface CollaboratorPickerProps {
  users: UserRow[];
  userSearchTerm: string;
  onUserSearchChange: (term: string) => void;
  selectedCollaborators: string[];
  onToggleCollaborator: (userId: string) => void;
  loadingUsers: boolean;
  currentUserId?: string;
}

const CollaboratorPicker: React.FC<CollaboratorPickerProps> = ({
  users,
  userSearchTerm,
  onUserSearchChange,
  selectedCollaborators,
  onToggleCollaborator,
  loadingUsers,
  currentUserId,
}) => {
    // Filter users based on search and exclude current user
    const filteredUsers = users.filter(u => {
        // More robust owner exclusion - handle string comparison and null/undefined cases
        const isOwner = currentUserId && u.id && (
            u.id === currentUserId || 
            u.id.toString() === currentUserId.toString()
        );
        
        if (isOwner) {
            return false; // Exclude current user
        }
        
        const searchLower = userSearchTerm.toLowerCase();
        return (
            u.display_name?.toLowerCase().includes(searchLower) ||
            u.role?.toLowerCase().includes(searchLower) ||
            u.department?.toLowerCase().includes(searchLower)
        );
    });

  return (
    <div className="space-y-2">
      <Label htmlFor="collaborators" className="text-base font-medium">
        Collaborators
      </Label>

      {/* Search input for collaborators */}
      <Input
        placeholder="Search team members..."
        value={userSearchTerm}
        onChange={(e) => onUserSearchChange(e.target.value)}
        className="h-11"
      />

      {/* Collaborator selection area */}
      <div className="border rounded-md p-3 bg-background max-h-48 overflow-y-auto">
        {loadingUsers ? (
          <div className="text-sm text-muted-foreground">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {userSearchTerm
              ? "No users found matching your search."
              : "No other users available."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded"
              >
                <Checkbox
                  checked={selectedCollaborators.includes(user.id)}
                  // shadcn Checkbox onCheckedChange is boolean | "indeterminate"
                  onCheckedChange={() => onToggleCollaborator(user.id)}
                />
                <div className="text-sm">
                  <div className="font-medium">
                    {user.display_name || `${user.role} User`}
                  </div>
                  <div className="text-muted-foreground">
                    {user.role} • {user.department || "No department"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Selected collaborators summary */}
      {selectedCollaborators.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedCollaborators.length} team member
          {selectedCollaborators.length !== 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
};

export default CollaboratorPicker;
