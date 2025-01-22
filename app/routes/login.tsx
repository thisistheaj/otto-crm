import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { createServerSupabase } from "~/utils/supabase.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";

export const loader = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();

  // If user is already logged in, redirect to home
  if (user) {
    return redirect("/", { headers: response.headers });
  }

  return json({}, { headers: response.headers });
};

export const action = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return json({ error: error.message });
  }

  return redirect("/", { headers: response.headers });
};

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <Form method="post">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {actionData?.error && (
              <div className="text-sm text-destructive">
                {actionData.error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full">
              Sign In
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              Don't have an account?{" "}
              <a href="/register" className="text-primary hover:underline">
                Sign up
              </a>
            </div>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
} 