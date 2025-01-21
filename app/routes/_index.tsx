import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useOutletContext } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { getProfile, isProfileComplete, updateProfile } from "~/models/profile.server";
import { getWorkspaces, type WorkspaceMembershipWithWorkspace } from "~/models/workspace.server";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useState, useEffect } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2 } from "lucide-react";

export async function action({ request }: { request: Request }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const fullName = formData.get("full_name") as string;
  const avatarUrl = formData.get("avatar_url") as string;

  await updateProfile(supabase, session.user.id, {
    full_name: fullName,
    ...(avatarUrl && { avatar_url: avatarUrl }),
    updated_at: new Date().toISOString(),
  });

  return json({ success: true }, { headers: response.headers });
}

export const loader = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return json({ 
      session: null,
      workspaces: [] as WorkspaceMembershipWithWorkspace[],
      profile: null,
      isComplete: false
    }, { 
      headers: response.headers 
    });
  }

  const [profile, workspaces] = await Promise.all([
    getProfile(supabase, session.user.id),
    getWorkspaces(supabase, session.user.id)
  ]);

  const isComplete = await isProfileComplete(supabase, session.user.id);

  return json({ 
    session,
    profile,
    workspaces,
    isComplete
  }, { 
    headers: response.headers 
  });
};

export default function Index() {
  const { session, profile, workspaces, isComplete } = useLoaderData<typeof loader>();
  const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>();
  const [showProfileDialog, setShowProfileDialog] = useState(!isComplete);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (isComplete && navigation.state === "idle") {
      setShowProfileDialog(false);
    }
  }, [isComplete, navigation.state]);

  if (!session) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Welcome to Otto CRM</CardTitle>
            <CardDescription>Sign in to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Select Workspace</CardTitle>
            <CardDescription>
              Choose a workspace or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workspaces?.length > 0 ? (
                <div className="space-y-2">
                  {(workspaces as WorkspaceMembershipWithWorkspace[]).map((membership) => (
                    <Button
                      key={membership.workspace_id}
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link to={`/workspace/${membership.workspace_id}`}>
                        <span className="flex-1 text-left">
                          {membership.workspaces.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {membership.role}
                        </span>
                      </Link>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You don't have any workspaces yet
                </p>
              )}
              <div className="flex gap-4">
                <Button asChild className="flex-1">
                  <Link to="/workspace/new">Create Workspace</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/workspace/join">Join Workspace</Link>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Form action="/logout" method="post" className="w-full">
              <Button variant="ghost" className="w-full">
                Sign Out
              </Button>
            </Form>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please provide your full name and profile picture before continuing.
            </DialogDescription>
          </DialogHeader>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile?.full_name || ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>
                    {profile?.full_name
                      ? profile.full_name
                          .split(' ')
                          .map((name: string) => name.charAt(0))
                          .join('')
                      : '?'}
                  </AvatarFallback>
                </Avatar>
                <input 
                  type="hidden" 
                  name="avatar_url" 
                  value={avatarUrl} 
                />
                <div className="flex-1 space-y-2">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    required={!avatarUrl}
                    disabled={isUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && session) {
                        setIsUploading(true);
                        setUploadError(null);
                        try {
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from("avatars")
                            .upload(`${session.user.id}/${Date.now()}`, file);

                          if (uploadError) {
                            console.error('Upload error:', uploadError);
                            setUploadError(uploadError.message);
                            return;
                          }

                          const { data: { publicUrl } } = supabase.storage
                            .from("avatars")
                            .getPublicUrl(uploadData.path);

                          // Update both the state and hidden input
                          setAvatarUrl(publicUrl);
                        } catch (error) {
                          console.error('Upload error:', error);
                          setUploadError('An unexpected error occurred during upload');
                        } finally {
                          setIsUploading(false);
                        }
                      }
                    }}
                  />
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  )}
                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
