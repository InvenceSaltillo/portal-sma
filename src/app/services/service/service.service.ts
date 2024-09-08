import { Injectable, computed, inject, signal } from '@angular/core';
import { GlobalState } from '../../interfaces/global-state.interface';
import { ServiceType } from '../../interfaces/service-type.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Service } from '../../interfaces/service.interface';
import { catchError, map, of } from 'rxjs';

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
  serviceUrl = `${environment.apiUrl}service`

  constructor() { }

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
      this.http.get<Service[]>(`${this.serviceUrl}/service-type/${serviceTypeId}`)
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
