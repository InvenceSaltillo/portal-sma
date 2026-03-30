import { Injectable, computed, inject, signal } from '@angular/core';
import { GlobalState } from '../../interfaces/global-state.interface';
import { ServiceType } from '../../interfaces/service-type.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, of, firstValueFrom } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  #state = signal<GlobalState<ServiceType[]>>({
    loading: true,
    data: [],
    error: undefined,
  });

  public serviceTypes = computed(() => this.#state().data);
  public loading = computed(() => this.#state().loading);
  public error = computed(() => this.#state().error);

  private http = inject(HttpClient);
  serviceTypeUrl = `${environment.apiUrl}/service-types`
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getByClientId(clientId: string): Promise<void> {
    // Usar nueva API
    try {
      this.#state.update((state) => ({ ...state, loading: true, error: undefined }));
      const data = await firstValueFrom(
        this.http.get<any[]>(`${this.serviceTypeUrl}?client_id=${clientId}`)
      );

      this.#state.update((state) => ({ ...state, data, loading: false, error: undefined }));
    } catch (error) {
      console.error('Error fetching service types:', error);
      this.#state.update((state) => ({ ...state, error, loading: false }));
      throw error;
    }

    // Código antiguo con Supabase (deprecado)
    /*const { data, error } = await this.supabase
      .from('service_types')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }

    this.#state.update((state) => ({ ...state, data }));*/
  }

  getAll() {
    this.#state.set({ ...this.#state(), error: undefined });
    try {
      this.http.get<ServiceType[]>(this.serviceTypeUrl).pipe(
        catchError(error => {
          this.#state.set({
            loading: false,
            data: [],
            error: 'No se pudo cargar los tipos de servicio, intente de nuevo más tarde.'
          });

          return of();
        })
      ).subscribe(response => {
        this.#state.set({
          loading: false,
          data: response,
        });
      });
    } catch (error) {
      this.#state.set({
        loading: false,
        data: [],
        error: error
      });
    }
  }
}
