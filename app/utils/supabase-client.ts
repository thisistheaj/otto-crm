import { createBrowserClient } from '@supabase/auth-helpers-remix';
import { useRevalidator } from '@remix-run/react';
import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export const useSupabase = () => {
  const [supabase] = useState(() => 
    createBrowserClient(
      window.env.SUPABASE_URL,
      window.env.SUPABASE_ANON_KEY
    )
  );
  const { revalidate } = useRevalidator();

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

  return supabase;
};

declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
} 