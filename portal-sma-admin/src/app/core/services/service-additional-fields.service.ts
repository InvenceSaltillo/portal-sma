import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

export interface ServiceAdditionalFieldRow {
  id: string;
  service_id: string;
  name: string;
  description: string;
  is_date: boolean;
  is_required: boolean;
  excel_column: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ServiceAdditionalFieldInsert {
  service_id: string;
  name: string;
  description: string;
  is_date: boolean;
  is_required: boolean;
  excel_column: string;
  sort_order?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceAdditionalFieldsService {
  private readonly auth = inject(AuthService);

  async listByServiceId(
    serviceId: string
  ): Promise<{ data: ServiceAdditionalFieldRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('service_additional_fields')
      .select(
        `
        id,
        service_id,
        name,
        description,
        is_date,
        is_required,
        excel_column,
        sort_order,
        created_at,
        updated_at
      `
      )
      .eq('service_id', serviceId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    return {
      data: (data as ServiceAdditionalFieldRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: ServiceAdditionalFieldInsert
  ): Promise<{ data: ServiceAdditionalFieldRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('service_additional_fields')
      .insert({
        service_id: row.service_id,
        name: row.name.trim(),
        description: row.description.trim(),
        is_date: row.is_date,
        is_required: row.is_required,
        excel_column: row.excel_column.trim(),
        sort_order: row.sort_order ?? 0,
      })
      .select()
      .single();

    return {
      data: data as ServiceAdditionalFieldRow | null,
      error,
    };
  }

  async deleteById(
    id: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('service_additional_fields')
      .delete()
      .eq('id', id);

    return { error };
  }
}
