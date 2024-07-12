import { Injectable, computed, inject, signal } from '@angular/core';
import { GlobalState } from '../../interfaces/global-state.interface';
import { ServiceType } from '../../interfaces/service-type.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, of } from 'rxjs';

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
  serviceTypeUrl = `${environment.apiUrl}service-type`

  constructor() { }

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
