import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function getProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // If profile doesn't exist, create one
  if (error?.code === 'PGRST116') {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select()
      .single();

    if (insertError) throw insertError;
    return newProfile;
  }

  if (error) throw error;
  return profile;
}

export async function updateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  update: ProfileUpdate
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return profile;
}

export async function isProfileComplete(supabase: SupabaseClient<Database>, userId: string) {
  const profile = await getProfile(supabase, userId);
  return Boolean(profile?.full_name && profile?.avatar_url);
} 