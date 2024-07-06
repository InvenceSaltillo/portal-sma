import { HttpClient } from '@angular/common/http';
import { GlobalState } from './../../interfaces/global-state.interface';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LoginResponse, RegisterResponse } from '../../interfaces/auth.interface';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  #state = signal<GlobalState<LoginResponse>>({
    loading: true,
  });

  private http = inject(HttpClient);

  private router = inject(Router);

  public user = computed(() => this.#state().data?.user);
  public loading = computed(() => this.#state().loading);

  authUrl = `${environment.apiUrl}auth`

  constructor() { }

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
