import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/** Fila de `public.management_plan_topics`. */
export interface ManagementPlanTopicRow {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ManagementPlanTopicInsert {
  client_id: string;
  name: string;
  description: string | null;
}

export interface ManagementPlanTopicUpdate {
  name: string;
  description: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ManagementPlanTopicsService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: ManagementPlanTopicRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('management_plan_topics')
      .select('id, client_id, name, description, created_at, updated_at')
      .eq('client_id', clientId)
      .order('name', { ascending: true });

    return {
      data: (data as ManagementPlanTopicRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: ManagementPlanTopicInsert
  ): Promise<{ data: ManagementPlanTopicRow | null; error: PostgrestError | null }> {
    const name = row.name.trim();
    const description = nullIfEmpty(row.description);
    const { data, error } = await this.auth.client
      .from('management_plan_topics')
      .insert({
        name,
        description,
        client_id: row.client_id,
      })
      .select('id, client_id, name, description, created_at, updated_at')
      .single();

    return {
      data: (data as ManagementPlanTopicRow) ?? null,
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: ManagementPlanTopicRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('management_plan_topics')
      .select('id, client_id, name, description, created_at, updated_at')
      .eq('id', id)
      .eq('client_id', clientId)
      .maybeSingle();

    return {
      data: (data as ManagementPlanTopicRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    clientId: string,
    patch: ManagementPlanTopicUpdate
  ): Promise<{ data: ManagementPlanTopicRow | null; error: PostgrestError | null }> {
    const name = patch.name.trim();
    const description = nullIfEmpty(patch.description);
    const { data, error } = await this.auth.client
      .from('management_plan_topics')
      .update({
        name,
        description,
      })
      .eq('id', id)
      .eq('client_id', clientId)
      .select('id, client_id, name, description, created_at, updated_at')
      .single();

    return {
      data: (data as ManagementPlanTopicRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('management_plan_topics')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);

    return { error };
  }
}

function nullIfEmpty(s: string | null | undefined): string | null {
  const t = (s ?? '').trim();
  return t === '' ? null : t;
}
