import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceRequirementLinkDto } from '../../interfaces/service-requirement.interface';

@Injectable({ providedIn: 'root' })
export class ServiceRequirementsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/services`;

  listByServiceId(serviceId: string): Observable<ServiceRequirementLinkDto[]> {
    return this.http.get<ServiceRequirementLinkDto[]>(
      `${this.baseUrl}/${serviceId}/requirements`
    );
  }
}
