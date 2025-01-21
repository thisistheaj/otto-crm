import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-remix";
import { createServerSupabase } from "./utils/supabase.server";
import "~/tailwind.css";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: { request: Request }) => {
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
  if (!process.env.SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required');

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { session } } = await supabase.auth.getSession();
  
  return json({ 
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    },
    session
  }, { headers: response.headers });
};

export default function App() {
  const { env, session } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const [supabase] = useState(() => 
    createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!)
  );

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      revalidate();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, revalidate]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans antialiased">
        <Outlet context={{ supabase, session }} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
