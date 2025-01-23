import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation, useOutletContext } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { getProfile, updateProfile } from "~/models/profile.server";
import { getWorkspaces } from "~/models/workspace.server";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export async function action({ request }: { request: Request }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const fullName = formData.get("full_name") as string;
  const avatarUrl = formData.get("avatar_url") as string;
  const isAvailable = formData.get("is_available") === "true";

  await updateProfile(supabase, user.id, {
    full_name: fullName,
    ...(avatarUrl && { avatar_url: avatarUrl }),
    is_available: isAvailable,
    updated_at: new Date().toISOString(),
  });

  return json({ success: true }, { headers: response.headers });
}

export const loader = async ({ request, params }: { request: Request; params: { id: string } }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [profile, workspaces] = await Promise.all([
    getProfile(supabase, user.id),
    getWorkspaces(supabase, user.id)
  ]);

  return json({ 
    profile,
    workspaces,
    currentWorkspaceId: params.id
  }, { 
    headers: response.headers 
  });
};

export default function Settings() {
  const { profile, workspaces, currentWorkspaceId } = useLoaderData<typeof loader>();
  const { supabase } = useOutletContext<{ supabase: SupabaseClient<Database> }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  return (
    <div className="container py-8 max-w-2xl pl-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploading(true);
                          setUploadError(null);
                          try {
                            const { data: uploadData, error: uploadError } = await supabase.storage
                              .from("avatars")
                              .upload(`${profile.id}/${Date.now()}`, file);

                            if (uploadError) {
                              console.error('Upload error:', uploadError);
                              setUploadError(uploadError.message);
                              return;
                            }

                            const { data: { publicUrl } } = supabase.storage
                              .from("avatars")
                              .getPublicUrl(uploadData.path);

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

              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="available"
                    name="is_available"
                    value="true"
                    defaultChecked={profile?.is_available}
                  />
                  <Label htmlFor="available">Online</Label>
                  
                  <input
                    type="radio"
                    id="unavailable"
                    name="is_available"
                    value="false"
                    defaultChecked={!profile?.is_available}
                    className="ml-4"
                  />
                  <Label htmlFor="unavailable">Offline</Label>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace Quick Switcher</CardTitle>
            <CardDescription>
              Switch between your workspaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workspaces?.map((membership) => (
                <Button
                  key={membership.workspace_id}
                  variant={membership.workspace_id === currentWorkspaceId ? "default" : "outline"}
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
              <div className="flex gap-4 pt-4">
                <Button asChild className="flex-1">
                  <Link to="/workspace/new">Create Workspace</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to="/workspace/join">Join Workspace</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 