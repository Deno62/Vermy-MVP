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
    if (email === seededCredentials.email && password === seededCredentials.password) {
      const name = email.split('@')[0];
      const user: AuthUser = { email, name };
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ok: true };
    }
    return { ok: false, error: 'Ungültige Zugangsdaten' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Login fehlgeschlagen' };
  }
}

export async function signUp(_email: string, _password: string): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Registrierung im Offline-Modus nicht verfügbar' };
}

export async function resetPassword(_email: string): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: 'Passwort-Zurücksetzen im Offline-Modus nicht verfügbar' };
}

export async function logout() {
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {}
}

export const seededCredentials = {
  email: 'admin@vermy.local',
  password: 'Vermy!123',
};