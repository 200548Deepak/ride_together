import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
  user_metadata?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    gender?: string;
    [key: string]: any;
  };
}

const LOCAL_USER_STORAGE_KEY = 'ride_together_user';

/**
 * Checks whether Supabase has been properly configured with valid credentials
 * rather than fallback placeholder values.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes('placeholder.supabase.co') || key.includes('placeholder-anon-key')) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Retrieves the locally persisted user session from localStorage (demo/fallback mode).
 */
export function getLocalUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists the user session to localStorage and dispatches an auth change event.
 */
export function saveLocalUser(user: AppUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth-change', { detail: user }));
  } catch (err) {
    console.error('Failed to save local user', err);
  }
}

/**
 * Clears the local user session and notifies listeners.
 */
export function removeLocalUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('auth-change', { detail: null }));
  } catch (err) {
    console.error('Failed to remove local user', err);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
