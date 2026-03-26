import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

export interface TenureTypeRow {
  id: string;
  client_id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TenureTypeInsert {
  client_id: string;
  name: string;
}

export interface TenureTypeUpdate {
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class TenureTypesService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: TenureTypeRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('tenure_types')
      .select('id, client_id, name, created_at, updated_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    return {
      data: (data as TenureTypeRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: TenureTypeInsert
  ): Promise<{ data: TenureTypeRow | null; error: PostgrestError | null }> {
    const name = row.name.trim();
    const { data, error } = await this.auth.client
      .from('tenure_types')
      .insert({
        name,
        client_id: row.client_id,
      })
      .select('id, client_id, name, created_at, updated_at')
      .single();

    return {
      data: (data as TenureTypeRow) ?? null,
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: TenureTypeRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('tenure_types')
      .select('id, client_id, name, created_at, updated_at')
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as TenureTypeRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: TenureTypeUpdate
  ): Promise<{ data: TenureTypeRow | null; error: PostgrestError | null }> {
    const name = patch.name.trim();
    const { data, error } = await this.auth.client
      .from('tenure_types')
      .update({ name })
      .eq('id', id)
      .eq('client_id', clientId)
      .select('id, client_id, name, created_at, updated_at')
      .single();

    return {
      data: (data as TenureTypeRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('tenure_types')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }
}
