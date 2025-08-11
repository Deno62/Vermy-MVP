export type AuthUser = {
  email: string;
  name: string;
};

const ADMIN = { email: 'admin@vermy.local', password: 'Vermy!123', name: 'Admin' } as const;
const USER_KEY = 'vermy_auth_user';

function ensureSeeded() {
  // We keep credentials in memory; only store logged-in user in localStorage
  if (!window.localStorage.getItem(USER_KEY)) {
    // no-op: do not auto-login
  }
}

export function isAuthenticated(): boolean {
  ensureSeeded();
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

export function login(email: string, password: string): { ok: boolean; error?: string } {
  ensureSeeded();
  if (email === ADMIN.email && password === ADMIN.password) {
    const user: AuthUser = { email: ADMIN.email, name: ADMIN.name };
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { ok: true };
  }
  return { ok: false, error: 'Ungültige Zugangsdaten' };
}

export function logout() {
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {}
}

export const seededCredentials = {
  email: ADMIN.email,
  password: ADMIN.password,
};
