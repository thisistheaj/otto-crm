import { redirect } from "@remix-run/node";
import { createServerSupabase } from "~/utils/supabase.server";

export const action = async ({ request }: { request: Request }) => {
  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  
  await supabase.auth.signOut();
  
  return redirect("/login", { headers: response.headers });
};

export const loader = async () => {
  return redirect("/");
}; 