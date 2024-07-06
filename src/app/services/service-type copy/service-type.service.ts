import { Injectable, computed, inject, signal } from '@angular/core';
import { GlobalState } from '../../interfaces/global-state.interface';
import { ServiceType } from '../../interfaces/service-type.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  #state = signal<GlobalState<ServiceType[]>>({
    loading: true,
    data: [],
  });

  public serviceTypes = computed(() => this.#state().data);
  public loading = computed(() => this.#state().loading);

  private http = inject(HttpClient);
  serviceTypeUrl = `${environment.apiUrl}service-type`

  constructor() { }

  getAll() {
    this.http.get<ServiceType[]>(this.serviceTypeUrl)
      .subscribe(response => {
        console.log('DEBUG: response', response);
        this.#state.set({
          loading: false,
          data: response,
        });
      });
  }
}
