import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useOutletContext } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";
import { MemberList } from "~/components/settings/member-list";
import { WorkspaceInfo } from "~/components/settings/workspace-info";
import { getWorkspace, getWorkspaces, getWorkspaceMembers, updateWorkspace, deleteWorkspace, updateMemberRole, removeMember } from "~/models/workspace.server";
import { useToast } from "~/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "update_name": {
      const name = formData.get("name") as string;
      await updateWorkspace(supabase, params.id, { name });
      break;
    }
    case "delete": {
      await deleteWorkspace(supabase, params.id);
      return redirect("/");
    }
    case "update_role": {
      const memberId = formData.get("member_id") as string;
      const role = formData.get("role") as string;
      await updateMemberRole(supabase, params.id, memberId, role);
      break;
    }
    case "remove_member": {
      const memberId = formData.get("member_id") as string;
      await removeMember(supabase, params.id, memberId);
      break;
    }
    default:
      throw new Response("Invalid action", { status: 400 });
  }

  return json({ success: true }, { headers: response.headers });
}

export const loader = async ({ request, params }: { request: Request; params: { id: string } }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [workspace, members] = await Promise.all([
    getWorkspace(supabase, params.id, user.id),
    getWorkspaceMembers(supabase, params.id)
  ]);

  const userRole = members.find(m => m.id === user.id)?.role;
  const isAdmin = userRole === "admin";

  return json({ 
    workspace,
    members,
    currentUser: user,
    isAdmin
  }, { 
    headers: response.headers 
  });
};

export default function Team() {
  const { workspace, members, currentUser, isAdmin } = useLoaderData<typeof loader>();
  const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>();
  const { toast } = useToast();

  const handleUpdateName = async (name: string) => {
    const formData = new FormData();
    formData.append("action", "update_name");
    formData.append("name", name);

    const response = await fetch(`/workspace/${workspace.id}/team`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      toast({
        title: "Success",
        description: "Workspace name updated",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update workspace name",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const formData = new FormData();
    formData.append("action", "delete");

    await fetch(`/workspace/${workspace.id}/team`, {
      method: "POST",
      body: formData,
    });
  };

  const handleUpdateRole = async (memberId: string, role: string) => {
    const formData = new FormData();
    formData.append("action", "update_role");
    formData.append("member_id", memberId);
    formData.append("role", role);

    const response = await fetch(`/workspace/${workspace.id}/team`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      toast({
        title: "Success",
        description: "Member role updated",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const formData = new FormData();
    formData.append("action", "remove_member");
    formData.append("member_id", memberId);

    const response = await fetch(`/workspace/${workspace.id}/team`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      toast({
        title: "Success",
        description: "Member removed from workspace",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8 max-w-5xl pl-8">
      <h1 className="text-3xl font-bold mb-8">Team</h1>
      
      <div className="space-y-8">
        {isAdmin && (
          <WorkspaceInfo
            workspace={workspace}
            onUpdateName={handleUpdateName}
            onDelete={handleDelete}
          />
        )}

        <MemberList
          members={members}
          currentUserId={currentUser.id}
          isAdmin={isAdmin}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
        />
      </div>
    </div>
  );
} 