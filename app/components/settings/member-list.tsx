import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/components/ui/alert-dialog";
import { UserX } from "lucide-react";

type Member = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: string;
  is_available: boolean;
};

interface MemberListProps {
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
  onUpdateRole: (memberId: string, newRole: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function MemberList({ 
  members, 
  currentUserId, 
  isAdmin,
  onUpdateRole,
  onRemoveMember 
}: MemberListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback>
                  {member.full_name
                    ? member.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {member.full_name || "Unnamed User"}
              </span>
            </TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>
              {isAdmin && member.id !== currentUserId ? (
                <Select
                  defaultValue={member.role}
                  onValueChange={(value) => onUpdateRole(member.id, value)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="capitalize">{member.role}</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={member.is_available ? "default" : "secondary"}>
                {member.is_available ? "Online" : "Offline"}
              </Badge>
            </TableCell>
            {isAdmin && (
              <TableCell>
                {member.id !== currentUserId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <UserX className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {member.full_name || member.email} from the team? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRemoveMember(member.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 