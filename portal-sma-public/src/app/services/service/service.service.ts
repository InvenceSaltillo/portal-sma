import { Injectable, computed, inject, signal } from '@angular/core';
import { GlobalState } from '../../interfaces/global-state.interface';
import { ServiceType } from '../../interfaces/service-type.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Service } from '../../interfaces/service.interface';
import { catchError, map, of, firstValueFrom } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  #state = signal<GlobalState<Service[]>>({
    loading: false,
    data: [],
  });

  public services = computed(() => this.#state().data);
  public serviceSelected = computed(() => this.#state().data);
  public loading = computed(() => this.#state().loading);
  public error = computed(() => this.#state().error);

  private http = inject(HttpClient);
  serviceUrl = `${environment.apiUrl}/services`
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async getFormFieldsByService(serviceId: string): Promise<any[]> {
    this.#state.update((state) => ({ ...state, loading: true }));
    const { data, error } = await this.supabase
      .rpc('get_form_fields_by_service', { p_service_id: serviceId });

    if (error) {
      console.error('Error fetching form fields:', error);
      throw error;
    }

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return parsed;
    } catch (e) {
      console.warn('No se pudo parsear la respuesta de la función:', e);
      return [];
    } finally {
      this.#state.update((state) => ({ ...state, loading: false }));
    }
  }

  async getByClientId(clientId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching service:', error);
      throw error;
    }

    this.#state.update((state) => ({ ...state, data })); // guardar data en el state
  }

  async getByServiceTypeAndClient(serviceTypeId: string, clientId: string): Promise<void> {
    this.#state.update((state) => ({ ...state, loading: true }));

    try {
      // Usar nueva API
      const data = await firstValueFrom(
        this.http.get<any[]>(`${this.serviceUrl}/by-type/${serviceTypeId}?client_id=${clientId}`)
      );

      this.#state.update((state) => ({ ...state, data, loading: false }));
    } catch (error) {
      console.error('Error fetching services:', error);
      this.#state.update((state) => ({ ...state, error, loading: false }));
      throw error;
    }
    
    // Código antiguo con Supabase (deprecado)
    /*try {
      const { data, error } = await this.supabase
        .from('services')
        .select('*')
        .eq('service_type_id', serviceTypeId)
        .eq('client_id', clientId);

      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }

      this.#state.update((state) => ({ ...state, data }));
    } finally {
      this.#state.update((state) => ({ ...state, loading: false }));
    }*/
  }

  getAll() {
    try {
      this.http.get<Service[]>(this.serviceUrl).pipe(
        catchError(error => {
          this.#state.set({
            loading: false,
            data: [],
            error: 'No se pudo obtener los servicios, intente de nuevo más tarde.'
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

  getByServiceType(serviceTypeId: string) {
    this.#state.set({ ...this.#state(), loading: true, error: undefined });
    try {
      // Usar nueva API
      this.http.get<Service[]>(`${this.serviceUrl}/by-type/${serviceTypeId}`)
        .pipe(
          catchError(error => {
            this.#state.set({
              loading: false,
              data: [],
              error: 'No se pudo obtener los servicios, intente de nuevo más tarde.'
            });

            return of();
          }))
        .subscribe(response => {
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

  getById(serviceId: string) {
    this.#state.set({ ...this.#state(), error: undefined });
    try {
      return this.http.get<Service>(`${this.serviceUrl}/${serviceId}`)
        .pipe(
          map(response => response),
          catchError(error => {
            this.#state.set({
              ...this.#state(),
              error: 'No se pudo obtener el formulario del servicio, intente de nuevo más tarde.',
            });
            return of();
          })
        );
    } catch (error) {
      this.#state.set({
        ...this.#state(),
        error: 'No se pudo obtener el formulario del servicio, intente de nuevo más tarde.',
      });
      return undefined;
    }
  }
}
