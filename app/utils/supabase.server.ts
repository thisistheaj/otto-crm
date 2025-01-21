import { createServerClient } from '@supabase/auth-helpers-remix';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required');
if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

// For authenticated routes that need session handling
export const createServerSupabase = ({
  request,
  response,
}: {
  request: Request;
  response: Response;
}) =>
  createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { request, response }
  );

// For server-side operations that don't need session handling
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Test the admin client connection
supabaseAdmin.from('workspaces').select('count').single()
  .then(({ error }) => {
    if (error) {
      console.error('Supabase admin client test failed:', error);
    } else {
      console.log('Supabase admin client initialized successfully');
    }
  }); 