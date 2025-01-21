import { json, redirect } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createWorkspace } from "~/models/workspace.server";

export async function action({ request }: { request: Request }) {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;

  const workspace = await createWorkspace(supabase, {
    name,
    created_by: session.user.id,
  });

  // Redirect to the new workspace
  return redirect(`/workspace/${workspace.id}`, {
    headers: response.headers,
  });
}

export default function NewWorkspace() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[450px]">
        <Form method="post">
          <CardHeader>
            <CardTitle>Create Workspace</CardTitle>
            <CardDescription>
              Create a new workspace to start collaborating with your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Awesome Team"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
} 