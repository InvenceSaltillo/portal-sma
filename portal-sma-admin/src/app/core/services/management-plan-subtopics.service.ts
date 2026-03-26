import { Injectable, inject } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

/** Relación embebida al listar subtemas. */
export interface ManagementPlanSubtopicTopicEmbed {
  name: string;
  client_id: string;
}

export interface ManagementPlanSubtopicRow {
  id: string;
  topic_id: string;
  orden: number;
  descripcion: string;
  created_at: string | null;
  updated_at: string | null;
  management_plan_topics?:
    | ManagementPlanSubtopicTopicEmbed
    | ManagementPlanSubtopicTopicEmbed[]
    | null;
}

export interface ManagementPlanSubtopicInsert {
  topic_id: string;
  orden: number;
  descripcion: string;
}

export interface ManagementPlanSubtopicUpdate {
  topic_id: string;
  orden: number;
  descripcion: string;
}

/** Nombre del tema para mostrar en tabla (respuesta embebida de PostgREST). */
export function embedTopicName(row: ManagementPlanSubtopicRow): string {
  const rel = row.management_plan_topics;
  if (rel == null) return '—';
  const first = Array.isArray(rel) ? rel[0] : rel;
  return (first?.name ?? '').trim() || '—';
}

@Injectable({
  providedIn: 'root',
})
export class ManagementPlanSubtopicsService {
  private readonly auth = inject(AuthService);

  async listByClientId(
    clientId: string
  ): Promise<{ data: ManagementPlanSubtopicRow[]; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('management_plan_subtopics')
      .select(
        `
        id,
        topic_id,
        orden,
        descripcion,
        created_at,
        updated_at,
        management_plan_topics!inner ( name, client_id )
      `
      )
      .eq('management_plan_topics.client_id', clientId)
      .order('orden', { ascending: true })
      .order('id', { ascending: true });

    return {
      data: (data as ManagementPlanSubtopicRow[]) ?? [],
      error,
    };
  }

  async insert(
    row: ManagementPlanSubtopicInsert
  ): Promise<{ data: ManagementPlanSubtopicRow | null; error: PostgrestError | null }> {
    const descripcion = row.descripcion.trim();
    const { data, error } = await this.auth.client
      .from('management_plan_subtopics')
      .insert({
        topic_id: row.topic_id,
        orden: row.orden,
        descripcion,
      })
      .select('id, topic_id, orden, descripcion, created_at, updated_at')
      .single();

    return {
      data: (data as ManagementPlanSubtopicRow) ?? null,
      error,
    };
  }

  async getByIdForClient(
    id: string,
    clientId: string
  ): Promise<{ data: ManagementPlanSubtopicRow | null; error: PostgrestError | null }> {
    const { data, error } = await this.auth.client
      .from('management_plan_subtopics')
      .select(
        `
        id,
        topic_id,
        orden,
        descripcion,
        created_at,
        updated_at,
        management_plan_topics!inner ( client_id )
      `
      )
      .eq('id', id)
      .eq('management_plan_topics.client_id', clientId)
      .maybeSingle();

    return {
      data: (data as ManagementPlanSubtopicRow) ?? null,
      error,
    };
  }

  async updateForClient(
    id: string,
    _clientId: string,
    patch: ManagementPlanSubtopicUpdate
  ): Promise<{ data: ManagementPlanSubtopicRow | null; error: PostgrestError | null }> {
    const descripcion = patch.descripcion.trim();
    const { data, error } = await this.auth.client
      .from('management_plan_subtopics')
      .update({
        topic_id: patch.topic_id,
        orden: patch.orden,
        descripcion,
      })
      .eq('id', id)
      .select('id, topic_id, orden, descripcion, created_at, updated_at')
      .single();

    return {
      data: (data as ManagementPlanSubtopicRow) ?? null,
      error,
    };
  }

  async deleteForClient(
    id: string,
    _clientId: string
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.auth.client
      .from('management_plan_subtopics')
      .delete()
      .eq('id', id);

    return { error };
  }
}
