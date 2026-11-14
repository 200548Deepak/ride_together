'use client';

import { saveLocalUser, removeLocalUser } from './supabaseClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'passenger';
  phone?: string;
  rating?: number;
  ratings_count?: number;
  grade?: string;
  id_verified?: boolean;
  avatar_url?: string;
}

const TOKEN_KEY = 'ride_together_jwt_token';
const USER_KEY = 'ride_together_auth_user';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || getCookie('auth_token');
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setCookie('auth_token', token, 7);

  // Sync with legacy store for component compatibility
  saveLocalUser({
    id: user.id,
    email: user.email,
    name: user.name,
    user_metadata: { name: user.name, role: user.role }
  });

  window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user, token } }));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  deleteCookie('auth_token');

  removeLocalUser();

  window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
}

export function isLoggedIn(): boolean {
  return !!getAuthUser();
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getAuthUser());
  };

  window.addEventListener('auth-changed', handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('auth-changed', handler);
    window.removeEventListener('storage', handler);
  };
}

// Helpers for cookies
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`));
  return matches ? decodeURIComponent(matches[1]) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}
