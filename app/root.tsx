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
import { Toaster } from "~/components/ui/toaster";
import "~/tailwind.css";

declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: { request: Request }) => {
  if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
  if (!process.env.SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required');

  const response = new Response();
  const supabase = createServerSupabase({ request, response });
  const { data: { user } } = await supabase.auth.getUser();
  
  return json({ 
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    },
    user
  }, { headers: response.headers });
};

export default function App() {
  const { env } = useLoaderData<typeof loader>();
  const [supabase] = useState(() => {
    return createBrowserClient(
      env.SUPABASE_URL!,
      env.SUPABASE_ANON_KEY!
    );
  });

  useEffect(() => {
    supabase.realtime.setAuth(env.SUPABASE_ANON_KEY);
  }, [supabase, env.SUPABASE_ANON_KEY]);

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet context={{ supabase }} />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
