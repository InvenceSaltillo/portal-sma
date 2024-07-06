import { Injectable, computed, inject, signal } from '@angular/core';
import { GlobalState } from '../../interfaces/global-state.interface';
import { ServiceType } from '../../interfaces/service-type.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Service } from '../../interfaces/service.interface';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  #state = signal<GlobalState<Service[]>>({
    loading: true,
    data: [],
  });

  public services = computed(() => this.#state().data);
  public serviceSelected = computed(() => this.#state().data);
  public loading = computed(() => this.#state().loading);

  private http = inject(HttpClient);
  serviceUrl = `${environment.apiUrl}service`

  constructor() { }

  getAll() {
    this.http.get<Service[]>(this.serviceUrl)
      .subscribe(response => {
        console.log('DEBUG: response', response);
        this.#state.set({
          loading: false,
          data: response,
        });
      });
  }

  getByServiceType(serviceTypeId: string) {
    this.http.get<Service[]>(`${this.serviceUrl}/service-type/${serviceTypeId}`)
      .subscribe(response => {
        console.log('DEBUG: response', response);
        this.#state.set({
          loading: false,
          data: response,
        });
      });
  }

  getServiceName(serviceId: string): string {
    return this.services()?.find(service => service.id == serviceId)?.name ?? '';
  }
}
