import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export const loader = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  return json({ 
    session 
  }, { 
    headers: response.headers 
  });
};

export default function Index() {
  const { session } = useLoaderData<typeof loader>();

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome to Otto CRM</CardTitle>
          <CardDescription>
            {session ? "Manage your customers with ease" : "Sign in to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{session.user.email}</span>
              </p>
              <Button asChild className="w-full">
                <Link to="/protected">Go to Protected Page</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/register">Create Account</Link>
              </Button>
            </div>
          )}
        </CardContent>
        {session && (
          <CardFooter>
            <Form action="/logout" method="post" className="w-full">
              <Button variant="destructive" className="w-full">
                Sign Out
              </Button>
            </Form>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
