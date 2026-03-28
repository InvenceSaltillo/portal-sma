import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/** Valores permitidos en `service_document_details.detail_type`. */
export type ServiceDocumentDetailType =
  | 'caratula'
  | 'resolutivo_aprobado'
  | 'resolutivo_rechazado'
  | 'resolutivo_suspendido';

export interface ServiceDocumentDetailLinkedRow {
  id: string;
  document_template_id: string;
  detail_type: ServiceDocumentDetailType;
  valid_from: string;
  valid_to: string;
  sort_order: number;
  document_templates?: { id: string; name: string } | { id: string; name: string }[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceDocumentDetailsService {
  private readonly auth = inject(AuthService);

  async listLinkedToService(
    serviceId: string
  ): Promise<{
    data: ServiceDocumentDetailLinkedRow[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await this.auth.client
      .from('service_document_details')
      .select(
        `
        id,
        document_template_id,
        detail_type,
        valid_from,
        valid_to,
        sort_order,
        document_templates ( id, name )
      `
      )
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true });

    if (error) {
      return { data: [], error };
    }

    const rows = (data ?? []) as ServiceDocumentDetailLinkedRow[];
    return { data: rows, error: null };
  }

  async replaceForService(
    serviceId: string,
    links: {
      document_template_id: string;
      detail_type: ServiceDocumentDetailType;
      valid_from: string;
      valid_to: string;
    }[]
  ): Promise<{ error: PostgrestError | null }> {
    const { error: delErr } = await this.auth.client
      .from('service_document_details')
      .delete()
      .eq('service_id', serviceId);

    if (delErr) {
      return { error: delErr };
    }

    if (links.length === 0) {
      return { error: null };
    }

    const { error: insErr } = await this.auth.client
      .from('service_document_details')
      .insert(
        links.map((link, sort_order) => ({
          service_id: serviceId,
          document_template_id: link.document_template_id,
          detail_type: link.detail_type,
          valid_from: link.valid_from,
          valid_to: link.valid_to,
          sort_order,
        }))
      );

    return { error: insErr };
  }
}
