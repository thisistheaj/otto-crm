import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export const loader = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect("/login", { headers: response.headers });
  }

  return json({ 
    email: session.user.email 
  }, { 
    headers: response.headers 
  });
};

export default function Protected() {
  const { email } = useLoaderData<typeof loader>();

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Protected Page</CardTitle>
          <CardDescription>
            This page is only visible to authenticated users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are logged in as <span className="font-medium text-foreground">{email}</span>
          </p>
        </CardContent>
        <CardFooter>
          <Form action="/logout" method="post" className="w-full">
            <Button variant="destructive" className="w-full">
              Sign Out
            </Button>
          </Form>
        </CardFooter>
      </Card>
    </div>
  );
} 