import { HttpClient } from '@angular/common/http';
import { GlobalState } from './../../interfaces/global-state.interface';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LoginResponse, RegisterResponse } from '../../interfaces/auth.interface';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { AuthChangeEvent, AuthSession, createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseClient } from './../../core/supabase.client';


export interface Profile {
  id?: string
  username: string
  website: string
  avatar_url: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  _session: AuthSession | null = null;
  #state = signal<GlobalState<LoginResponse>>({
    loading: true,
  });

  private http = inject(HttpClient);

  private router = inject(Router);

  public user = computed(() => this.#state().data?.user);
  public loading = computed(() => this.#state().loading);

  authUrl = `${environment.apiUrl}/auth`;

  constructor() { }


  async getSession(): Promise<AuthSession | null> {
    try {
      const { data } = await supabaseClient.auth.getSession();
      this._session = data.session;
      return this._session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }


  profile(user: User) {
    return supabaseClient
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', user.id)
      .single()
  }

  authChanges(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabaseClient.auth.onAuthStateChange(callback)
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error('No se pudo obtener el UUID del usuario');

    // Espera a que el token esté completamente listo
    await new Promise(resolve => setTimeout(resolve, 100)); // 100-200ms

    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    return { session: data.session, user: userData };
  }


  signOut() {
    return supabaseClient.auth.signOut()
  }

  updateProfile(profile: Profile) {
    const update = {
      ...profile,
      updated_at: new Date(),
    }
    return supabaseClient.from('profiles').upsert(update)
  }

  downLoadImage(path: string) {
    return supabaseClient.storage.from('avatars').download(path)
  }

  uploadAvatar(filePath: string, file: File) {
    return supabaseClient.storage.from('avatars').upload(filePath, file)
  }

  login(email: string, password: string): Promise<LoginResponse> {
    const response: Promise<LoginResponse> = lastValueFrom(
      this.http.post<LoginResponse>(`${this.authUrl}/login`, { email, password })
    );
    return response;
  }

  register(user: any): Promise<RegisterResponse> {
    const response: Promise<RegisterResponse> = lastValueFrom(
      this.http.post<RegisterResponse>(`${this.authUrl}/register`, user)
    );
    return response;
  }

  forgotPassword(email: string): Promise<any> {
    const response: Promise<any> = lastValueFrom(
      this.http.post<any>(`${this.authUrl}/forgot-password`, { email })
    );
    return response;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigateByUrl('login');
  }
}
