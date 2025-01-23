import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { Check, Copy, Trash } from "lucide-react";

interface WorkspaceInfoProps {
  workspace: {
    id: string;
    name: string;
  };
  onUpdateName: (name: string) => void;
  onDelete: () => void;
}

export function WorkspaceInfo({ workspace, onUpdateName, onDelete }: WorkspaceInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [showCopied, setShowCopied] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleCopyId = () => {
    navigator.clipboard.writeText(workspace.id);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleSaveName = () => {
    if (workspaceName.trim() && workspaceName !== workspace.name) {
      onUpdateName(workspaceName);
    }
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Information</CardTitle>
        <CardDescription>
          Manage your workspace details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Workspace Name</Label>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Input value={workspace.name} readOnly className="flex-1" />
                <Button onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Workspace ID</Label>
          <div className="flex gap-2">
            <Input value={workspace.id} readOnly className="flex-1 font-mono text-sm" />
            <Button variant="outline" onClick={handleCopyId}>
              {showCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this ID with team members so they can join your workspace
          </p>
        </div>

        <div className="pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete Workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  workspace and remove all data associated with it.
                  <div className="mt-4">
                    <Label>
                      Type <span className="font-medium">{workspace.name}</span> to confirm
                    </Label>
                    <Input
                      value={deleteConfirmName}
                      onChange={(e) => setDeleteConfirmName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  disabled={deleteConfirmName !== workspace.name}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
} 