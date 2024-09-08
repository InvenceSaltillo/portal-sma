import { computed, inject, Injectable, signal } from '@angular/core';
import { Municipality } from '../../interfaces/municipality.interface';
import { environment } from '../../../environments/environment';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GlobalState } from '../../interfaces/global-state.interface';

@Injectable({
  providedIn: 'root'
})
export class MiscService {
  #state = signal<GlobalState<Municipality[]>>({
    loading: false,
    data: [],
  });

  public municipalities = computed(() => this.#state().data);
  public serviceSelected = computed(() => this.#state().data);
  public loading = computed(() => this.#state().loading);
  public error = computed(() => this.#state().error);


  apiUrl = `${environment.apiUrl}misc`;
  private http = inject(HttpClient);

  constructor() { }

  getMunicipalitiesByState2(stateId: string): Promise<Municipality[]> {
    const response: Promise<Municipality[]> = lastValueFrom(
      this.http.get<Municipality[]>(`${this.apiUrl}/municipalities/${stateId}`)
    );
    return response;
  }

  getMunicipalitiesByState(stateId: string) {
    this.#state.set({ ...this.#state(), error: undefined });
    try {
      return this.http.get<Municipality[]>(`${this.apiUrl}/municipalities/${stateId}`)
        .pipe(
          map(response => response),
          catchError(error => {
            this.#state.set({
              ...this.#state(),
              error: 'No se pudieron obtener los municipios, intente de nuevo más tarde.',
            });
            return of();
          })
        );
    } catch (error) {
      this.#state.set({
        ...this.#state(),
        error: 'No se pudieron obtener los municipios, intente de nuevo más tarde.',
      });
      return undefined;
    }
  }
}
