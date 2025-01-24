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
import { ThemeProvider } from "~/components/theme-provider";
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

// This script runs before React hydration to prevent flash
const themeScript = `
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try {
    theme = localStorage.getItem('theme') || theme;
  } catch {}
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
`;

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
  const { env, user } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const [supabase] = useState(() => createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY));

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      revalidate();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, revalidate]);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider defaultTheme="dark">
          <Outlet context={{ supabase }} />
          <Toaster />
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
