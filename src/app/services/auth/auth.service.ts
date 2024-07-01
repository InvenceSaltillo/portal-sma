import { HttpClient } from '@angular/common/http';
import { GlobalState } from './../../interfaces/global-state.interface';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LoginResponse } from '../../interfaces/auth.interface';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  #state = signal<GlobalState<LoginResponse>>({
    loading: true,
  });

  private http = inject(HttpClient);

  public user = computed(() => this.#state().data?.user);
  public loading = computed(() => this.#state().loading);

  constructor() {
  }

  login(email: string, password: string): Promise<LoginResponse> {
    console.log('DEBUG: AUTHSERVICE',);
    const response: Promise<LoginResponse> = lastValueFrom(
      this.http.post<LoginResponse>('http://127.0.0.1:8000/api/auth/login', { email, password })
    );
    return response;
    // this.http.post<LoginResponse>('http://127.0.0.1:8000/api/auth/login', { email, password })
    //   .subscribe(res => {
    //     this.#state.set({
    //       loading: false,
    //       data: {
    //         status: res.status,
    //         user: res.user,
    //         token: res.token,
    //       },
    //     });
    //   });
  }
}
