import { supabase } from '@/integrations/supabase/client';

export type AuthUser = {
  email: string;
  name: string;
};

const USER_KEY = 'vermy_auth_user';

export function isAuthenticated(): boolean {
  try {
    return !!window.localStorage.getItem(USER_KEY);
  } catch {
    return false;
  }
}

export function getUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { ok: false, error: error?.message || 'Ungültige Zugangsdaten' };
    }
    const name = email.split('@')[0];
    const user: AuthUser = { email, name };
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Login fehlgeschlagen' };
  }
}

export async function signUp(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const redirectUrl = `${window.location.origin}/login`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Registrierung fehlgeschlagen' };
  }
}

export async function resetPassword(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const redirectUrl = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Passwort-Zurücksetzen fehlgeschlagen' };
  }
}

export async function logout() {
  try {
    await supabase.auth.signOut();
  } catch {}
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {}
}

export const seededCredentials = {
  email: 'admin@vermy.local',
  password: 'Vermy!123',
};