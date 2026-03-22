import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { AppUser } from '../models/user.model';

function supabaseProjectRefFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.split('.')[0] ?? '';
  } catch {
    return '';
  }
}

/** Mismas claves que portal-sma-public (login.component) para compatibilidad con API. */
const LS_USER_KEY = 'user';
const LS_API_TOKEN_KEY = 'apiToken';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private readonly authTokenKey: string;
  /** Storage activo (local o sesión), alineado con la sesión de Supabase. */
  private activeStorage: Storage;

  /** Perfil de negocio (`users` + `client`). */
  readonly currentUser = signal<AppUser | null>(null);

  constructor() {
    const ref = supabaseProjectRefFromUrl(environment.supabaseUrl);
    this.authTokenKey = `sb-${ref}-auth-token`;
    this.activeStorage = this.pickStorageWithExistingSession();
    this.supabase = this.createClient(this.activeStorage);
    this.hydrateUserFromStorage();
  }

  /** Cliente Supabase (misma sesión que el login). */
  get client(): SupabaseClient {
    return this.supabase;
  }

  private pickStorageWithExistingSession(): Storage {
    try {
      if (localStorage.getItem(this.authTokenKey)) {
        return localStorage;
      }
      if (sessionStorage.getItem(this.authTokenKey)) {
        return sessionStorage;
      }
    } catch {
      /* modo privado u host sin storage */
    }
    return localStorage;
  }

  private createClient(storage: Storage): SupabaseClient {
    return createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  private hydrateUserFromStorage(): void {
    const parsed = this.readUserFromAnyStorage();
    if (parsed) {
      this.currentUser.set(parsed);
    }
  }

  private readUserFromAnyStorage(): AppUser | null {
    for (const storage of [localStorage, sessionStorage]) {
      try {
        const raw = storage.getItem(LS_USER_KEY);
        if (!raw) continue;
        return JSON.parse(raw) as AppUser;
      } catch {
        continue;
      }
    }
    return null;
  }

  private persistProfile(session: Session, user: AppUser): void {
    try {
      this.activeStorage.setItem(LS_USER_KEY, JSON.stringify(user));
      this.activeStorage.setItem(LS_API_TOKEN_KEY, session.access_token);
    } catch {
      /* quota / privado */
    }
    this.currentUser.set(user);
  }

  private clearProfileCache(): void {
    try {
      localStorage.removeItem(LS_USER_KEY);
      localStorage.removeItem(LS_API_TOKEN_KEY);
      sessionStorage.removeItem(LS_USER_KEY);
      sessionStorage.removeItem(LS_API_TOKEN_KEY);
    } catch {
      /* */
    }
    this.currentUser.set(null);
  }

  /**
   * Sesión actual (async). Usar en guards y después de login.
   */
  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error('[AuthService] getSession', error);
      return null;
    }
    return data.session;
  }

  /**
   * Token JWT de acceso (p. ej. para llamar a tu API con Bearer).
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token ?? null;
  }

  /**
   * Tras F5: si hay sesión Supabase, asegura perfil `users` en memoria (cache o BD).
   */
  async ensureAppUserLoaded(): Promise<boolean> {
    const session = await this.getSession();
    if (!session?.user?.id) {
      return false;
    }

    const authId = session.user.id;
    const cached = this.currentUser();
    if (cached?.id === authId) {
      return true;
    }

    const fromStorage = this.readUserFromAnyStorage();
    if (fromStorage?.id === authId) {
      this.currentUser.set(fromStorage);
      return true;
    }

    const { data, error } = await this.supabase
      .from('users')
      .select(`*, client:clients(*)`)
      .eq('id', authId)
      .single();

    if (error || !data) {
      console.error('[AuthService] ensureAppUserLoaded', error);
      return false;
    }

    this.persistProfile(session, data as AppUser);
    return true;
  }

  isAuthenticatedSync(): boolean {
    try {
      return !!(
        localStorage.getItem(this.authTokenKey) ||
        sessionStorage.getItem(this.authTokenKey)
      );
    } catch {
      return false;
    }
  }

  /**
   * Inicio de sesión con Supabase Auth + fila `users` y `clients` (igual que portal-sma-public).
   */
  async login(
    email: string,
    password: string,
    persistSession: boolean
  ): Promise<{ error: string | null }> {
    const normalizedEmail = email.trim();

    this.clearProfileCache();

    try {
      await this.supabase.auth.signOut({ scope: 'local' });
    } catch {
      /* ignorar */
    }

    localStorage.removeItem(this.authTokenKey);
    sessionStorage.removeItem(this.authTokenKey);

    this.activeStorage = persistSession ? localStorage : sessionStorage;
    this.supabase = this.createClient(this.activeStorage);

    const { data: authData, error: authError } =
      await this.supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (authError) {
      return { error: mapSupabaseAuthError(authError.message) };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { error: 'No se pudo obtener el UUID del usuario.' };
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select(`*, client:clients(*)`)
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      await this.supabase.auth.signOut({ scope: 'local' });
      return {
        error: mapUserTableError(userError),
      };
    }

    const session = authData.session;
    if (!session) {
      await this.supabase.auth.signOut({ scope: 'local' });
      return { error: 'No se pudo obtener la sesión.' };
    }

    this.persistProfile(session, userData as AppUser);
    return { error: null };
  }

  async logout(): Promise<void> {
    this.clearProfileCache();
    try {
      await this.supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('[AuthService] logout', e);
    }
    localStorage.removeItem(this.authTokenKey);
    sessionStorage.removeItem(this.authTokenKey);
  }
}

function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('invalid login credentials') ||
    m.includes('invalid_credentials')
  ) {
    return 'Correo o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión.';
  }
  if (m.includes('too many requests')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  return message || 'No se pudo iniciar sesión.';
}

function mapUserTableError(
  err: { message?: string; code?: string } | null
): string {
  if (!err) {
    return 'No se pudo cargar tu perfil de usuario.';
  }
  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();
  if (code === 'PGRST116' || msg.includes('0 rows')) {
    return 'No existe un registro de usuario asociado a esta cuenta. Contacta al administrador.';
  }
  if (msg.includes('permission denied') || msg.includes('rls')) {
    return 'No tienes permiso para acceder al perfil de usuario.';
  }
  return err.message || 'No se pudo cargar tu perfil de usuario.';
}
