import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { joinWorkspaceWithCode } from "~/models/workspace.server";

export async function action({ request }: { request: Request }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const code = formData.get("code") as string;

  try {
    const workspace = await joinWorkspaceWithCode(supabase, code, user.id);
    return redirect(`/workspace/${workspace.id}`, {
      headers: response.headers,
    });
  } catch (error: any) {
    return json({ 
      error: error.message || 'Failed to join workspace' 
    }, { 
      status: 400,
      headers: response.headers 
    });
  }
}

export default function JoinWorkspace() {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const isSubmitting = navigation.state === "submitting";
  const code = searchParams.get("code");

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[450px]">
        <Form method="post">
          <CardHeader>
            <CardTitle>Join Workspace</CardTitle>
            <CardDescription>
              Enter a workspace join code to become a member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Join Code</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={code || ''}
                  placeholder="Enter join code"
                  required
                />
              </div>
              {actionData?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Workspace"}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
} 