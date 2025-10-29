import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { TaskApi } from "@/lib/api";

type CreateCommentProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentCreated?: (comment: string) => void;
  taskId: string;
  currentUserId: string;
};

const CreateComment: React.FC<CreateCommentProps> = ({ open, onOpenChange, onCommentCreated, taskId, currentUserId }) => {
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      const response = await TaskApi.addComment(taskId, currentUserId, commentText.trim());
      console.log("Comment added successfully:", response);
      onCommentCreated?.(commentText.trim());
      setCommentText("");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[60vh] overflow-hidden shadow-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">Comment</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pb-4">
        <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md h-34 resize-none"
                placeholder="Write your comment..."
                required
            />
            </div>

            <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!commentText.trim() || loading}>
                {loading ? "Adding..." : "Add Comment"}
            </Button>
            </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateComment;