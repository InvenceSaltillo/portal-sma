import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

export interface LegalDocumentTypeRow {
  id: string;
  client_id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface LegalDocumentTypeInsert {
  client_id: string;
  name: string;
}

export interface LegalDocumentTypeUpdate {
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class LegalDocumentTypesService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: LegalDocumentTypeRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('legal_document_types')
      .select('id, client_id, name, created_at, updated_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    return {
      data: (data as LegalDocumentTypeRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: LegalDocumentTypeInsert
  ): Promise<{ data: LegalDocumentTypeRow | null; error: PostgrestError | null }> {
    const name = row.name.trim();
    const { data, error } = await this.auth.client
      .from('legal_document_types')
      .insert({
        name,
        client_id: row.client_id,
      })
      .select('id, client_id, name, created_at, updated_at')
      .single();

    return {
      data: (data as LegalDocumentTypeRow) ?? null,
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: LegalDocumentTypeRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('legal_document_types')
      .select('id, client_id, name, created_at, updated_at')
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as LegalDocumentTypeRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: LegalDocumentTypeUpdate
  ): Promise<{ data: LegalDocumentTypeRow | null; error: PostgrestError | null }> {
    const name = patch.name.trim();
    const { data, error } = await this.auth.client
      .from('legal_document_types')
      .update({ name })
      .eq('id', id)
      .eq('client_id', clientId)
      .select('id, client_id, name, created_at, updated_at')
      .single();

    return {
      data: (data as LegalDocumentTypeRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('legal_document_types')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }
}
