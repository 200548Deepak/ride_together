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
const USERS_REGISTRY_KEY = 'ride_together_registered_users';

/**
 * Generates a deterministic user ID based on email address.
 * Ensures the exact same account retains the identical ID across logouts and logins.
 */
export function generateDeterministicUserId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}

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
 * Looks up an account in the local registry by email.
 */
export function getRegisteredUser(email: string): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) return null;
    const registry = JSON.parse(raw);
    return registry[email.trim().toLowerCase()] || null;
  } catch {
    return null;
  }
}

/**
 * Saves a user to the persistent local accounts registry.
 */
export function saveRegisteredUser(user: AppUser): void {
  if (typeof window === 'undefined' || !user.email) return;
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    const registry = raw ? JSON.parse(raw) : {};
    registry[user.email.trim().toLowerCase()] = user;
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
  } catch (err) {
    console.error('Failed to save user to registry', err);
  }
}

/**
 * Persists the user session to localStorage and dispatches an auth change event.
 */
export function saveLocalUser(user: AppUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(user));
    saveRegisteredUser(user);
    window.dispatchEvent(new CustomEvent('auth-change', { detail: user }));
  } catch (err) {
    console.error('Failed to save local user', err);
  }
}

/**
 * Clears the local active session without deleting the user's registered account profile.
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
